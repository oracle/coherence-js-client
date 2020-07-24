/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { EntryAggregator } from '../aggregator/'
import { CacheLifecycleEvent, RequestStateEvent } from '../event/events' // RequestStateEvent not exported
import { MapEventsManager } from '../event/map-events-manager' // MapEventsManager not exported
import { MapListener } from '../event/'
import { ValueExtractor } from '../extractor/'
import { Filter, Filters, MapEventFilter } from '../filter/'
import { EntryProcessor } from '../processor/'
import { Comparator, MapEntry, RemoteSet } from '../util/'
import { RequestFactory } from '../util/request-factory' // RequestFactory not exported
import { Serializer, Util } from '../util/'
import { EventEmitter } from 'events'
import { BytesValue } from 'google-protobuf/google/protobuf/wrappers_pb'
import { ClientReadableStream, ServiceError } from 'grpc'
import { NamedCache } from './named-cache'
import {
  Entry,
  Entry as GrpcEntry,
  EntryResult,
  IsEmptyRequest,
  SizeRequest,
  TruncateRequest
} from './proto/messages_pb'
import { NamedCacheServiceClient } from './proto/services_grpc_pb'
import { Session, SessionOptions } from '.'
import { EntrySet, KeySet, NamedCacheEntry, ValueSet } from './streamed-collection' // none of these are exported

/**
 * Enum describing the possible states a {@link NamedCacheClient} is allowed to transition to.
 */
const enum CacheState {
  ACTIVE,
  CLOSING,
  CLOSED,
  DESTROYING,
  DESTROYED,
  RELEASING,
  RELEASED
}

/**
 * Class NamedCacheClient is a client to a NamedCache which is a Map that
 * holds resources shared among members of a cluster.
 *
 * All methods in this class return a Promise that eventually either
 * resolves to a value (as described in the NamedCache) or an error
 * if any exception occurs during the method invocation.
 *
 * This class also extends EventEmitter and emits the following
 * events:
 * 1. {@link CacheLifecycleEvent.DESTROYED}: when the underlying cache is destroyed
 * 2. {@link CacheLifecycleEvent.TRUNCATED}: when the underlying cache is truncated
 * 3. {@link CacheLifecycleEvent.RELEASED}: when the underlying cache is released
 *
 */
export class NamedCacheClient<K = any, V = any>
  extends EventEmitter
  implements NamedCache<K, V> {

  /**
   * @internal
   * The current {@link CacheState} of this cache.
   */
  private state = CacheState.ACTIVE

  /**
   * @internal
   * The session with the remote Coherence cluster.
   */
  private session: Session

  /**
   * The name of the Coherence `NamedCache`.
   */
  private readonly cacheName: string

  /**
   * The {@link Serializer} that will be used to ser/deser message payloads.
   */
  private readonly serializer: Serializer

  /**
   * @internal
   * The `gRPC` service client.
   */
  private readonly client: NamedCacheServiceClient

  /**
   * @internal
   * The `gRPC` request factory.
   */
  private readonly requestFactory: RequestFactory<K, V>

  /**
   * @internal
   * Events handling is a complex beast. So, best handled
   * by a separate class.
   */
  private readonly mapEventsHandler: MapEventsManager<K, V>

  /**
   * @internal
   * The set of options used to create the session.
   */
  private readonly sessOpts: SessionOptions

  /**
   * @internal
   * The internalEventEmitter is used by Session and this class for internal purposes. This
   * allows any asynchronous communication between Session | NamedCacheClient | MapEventsManager
   * to be handled independent of the eventual events seen by the client application.
   */
  private readonly internalEmitter: EventEmitter = new EventEmitter()

  /**
   * Create a new NamedCacheClient with the specified address and cache name.
   *
   * @param cacheName   the name of the coherence NamedCache
   * @param session     the session with the Coherence cluster
   * @param serializer  the serializer used to ser/deser messages
   */
  constructor (cacheName: string, session: Session, serializer: Serializer) {
    super()

    this.cacheName = cacheName
    this.session = session
    this.sessOpts = this.session.getSessionOptions()
    this.serializer = serializer

    this.requestFactory = new RequestFactory(this.cacheName, this.serializer)
    this.client = new NamedCacheServiceClient(
      session.getAddress(), // Ignored since we are using a shared Channel
      session.getChannelCredentials(),
      session.getClientOptions())

    // We maintain two separate EventEmitters;
    //
    // 1. The NamedCacheClient itself is an EventEmitter that is used by the client / application.
    //    Any client application that wishes to listen for CacheLifecycle events can simply
    //    use the ObservableMap interface and register EventListeners. ObservableMap provides
    //    the 'on()' method that can be used to register Listeners.
    //
    // 2. The internalEventEmitter is used by Session and this class for internal purposes. This
    //    allows any asynchronous communication between Session | NamedCacheClient | MapEventsManager
    //    to be handled independent of the eventual events seen by the client application.
    this.setupEventHandlers()

    // Now open the events channel.
    this.mapEventsHandler = new MapEventsManager(cacheName, this.client, this, this.serializer, this.internalEmitter)
  }

  // ----- public functions -------------------------------------------------

  /**
   * Return the {@link Serializer} used by this client.
   *
   * @return the {@link Serializer} used by this client
   */
  getSerializer (): Serializer {
    return this.serializer
  }

  /**
   * Internal method to return RequestFactory.
   *
   * @return An instance of RequestFactory
   */
  getRequestFactory (): RequestFactory<K, V> {
    return this.requestFactory
  }

  /**
   * Returns `true` if this cache contains a mapping for the specified key.
   *
   * @param key    the key whose presence in this cache is to be tested
   * @param value  the value expected to be associated with the specified key
   *
   * @return a `Promise` that eventually resolves to `true` if the mapping exists,
   *         or `false` if it does not
   */
  containsEntry (key: K, value: V): Promise<boolean> {
    const self = this
    return new Promise((resolve, reject) => {
      const request = self.requestFactory.containsEntry(key, value)
      self.client.containsEntry(request, this.callOptions(), (err, resp) => {
        self.resolveValue(resolve, reject, err, () => resp ? resp.getValue() : resp)
      })
    })
  }

  // ----- InvocableMap interface -------------------------------------------

  aggregate<R> (keys: Iterable<K>, agg: EntryAggregator<K, V, R>): Promise<any>;

  aggregate<R> (filter: Filter<V>, agg: EntryAggregator<K, V, R>): Promise<any>;

  aggregate<R> (agg: EntryAggregator<K, V, R>): Promise<any>;

  aggregate<R> (kfa: Iterable<K> | Filter<V> | EntryAggregator<K, V, R>, agg?: EntryAggregator<K, V, R>): Promise<any> {
    const self = this
    const request = this.requestFactory.aggregate(kfa, agg)
    return new Promise((resolve, reject) => {
      self.client.aggregate(request, this.callOptions(), (err, resp) => {
        if (err) {
          reject(err)
        } else {
          let result: any
          if (resp) {
            result = self.toValue(resp.getValue_asU8())
            if (result) {
              const typeStr = typeof result.entries
              if (typeStr != 'undefined' && typeStr != 'function') {
                result = result.entries
              }
            }
          }
          resolve(result)
        }
      })
    })
  }

  invoke<R> (key: K, processor: EntryProcessor<K, V, R>): Promise<R | null> {
    const self = this
    return new Promise((resolve, reject) => {
      self.client.invoke(self.requestFactory.invoke(key, processor), (err, resp) => {
        if (err) {
          reject(err)
        } else {
          self.resolveValue(resolve, reject, err, () => resp ? self.toValue(resp.getValue_asU8()) : resp)
        }
      })
    })
  }

  invokeAll<R = any> (processor: EntryProcessor<K, V, R>): Promise<Map<K, R>>;

  invokeAll<R = any> (keys: Iterable<K>, processor: EntryProcessor<K, V, R>): Promise<Map<K, R>>;

  invokeAll<R = any> (filter: Filter<V>, processor: EntryProcessor<K, V, R>): Promise<Map<K, R>>;

  invokeAll<R = any> (keysOrFilterOrProcessor: Iterable<K> | Filter<V> | EntryProcessor<K, V, R>, processor?: EntryProcessor<K, V, R>): Promise<Map<K, R>> {
    const self = this
    let keysOrFilter: Iterable<K> | Filter
    if (processor) {
      // Two args invocation
      if (keysOrFilterOrProcessor instanceof Filter) {
        keysOrFilter = keysOrFilterOrProcessor
      } else if (Util.isIterableType(keysOrFilterOrProcessor)) {
        keysOrFilter = keysOrFilterOrProcessor
      } else {
        throw new Error('invokeAll() takes only one processor as argument')
      }
    } else {
      // One arg (which is a EntryProcessor)
      keysOrFilter = Filters.always()
      processor = keysOrFilterOrProcessor as EntryProcessor
    }

    const call = self.client.invokeAll(self.requestFactory.invokeAll(keysOrFilter, processor), this.callOptions())
    const result: Map<K, R> = new Map<K, R>()
    return this.doInvokeAll(call, result)
  }

  // ----- ObservableMap interface ------------------------------------------

  addMapListener (listener: MapListener<K, V>, isLite?: boolean): Promise<void>;

  addMapListener (listener: MapListener<K, V>, key: K, isLite?: boolean): Promise<void>;

  addMapListener (listener: MapListener<K, V>, filter: MapEventFilter, isLite?: boolean): Promise<void>;

  addMapListener (listener: MapListener<K, V>, keyOrFilterOrLite?: MapEventFilter | K | boolean, isLite?: boolean): Promise<void> {
    let lite = false

    if (isLite != undefined) {
      // three args invocation
      lite = isLite
    }
    if (keyOrFilterOrLite) {
      if (keyOrFilterOrLite instanceof MapEventFilter) {
        return this.mapEventsHandler.registerFilterListener(listener, keyOrFilterOrLite, lite)
      } else if (typeof keyOrFilterOrLite === 'boolean') {
        // Two arg invocation.
        return this.mapEventsHandler.registerFilterListener(listener, null, lite)
      } else {
        return this.mapEventsHandler.registerKeyListener(listener, keyOrFilterOrLite, lite)
      }
    }

    // One arg invocation.
    return this.mapEventsHandler.registerFilterListener(listener, null, lite)
  }

  // TODO(rlubke) Fix - this should be inherited
  removeMapListener (listener: MapListener<K, V>): Promise<void>;

  removeMapListener (listener: MapListener<K, V>, key: K): Promise<void>;

  removeMapListener (listener: MapListener<K, V>, filter: MapEventFilter): Promise<void>;

  removeMapListener (listener: MapListener<K, V>, keyOrFilter?: MapEventFilter | K | null): Promise<void> {
    if (keyOrFilter) {
      return (keyOrFilter instanceof MapEventFilter)
        ? this.mapEventsHandler.removeFilterListener(listener, keyOrFilter)
        : this.mapEventsHandler.removeKeyListener(listener, keyOrFilter)
    }
    return this.mapEventsHandler.removeFilterListener(listener, null)
  }

  // ----- QueryMap interface -----------------------------------------------

  addIndex (extractor: ValueExtractor, ordered?: boolean, comparator?: Comparator): Promise<void> {
    const self = this
    const request = this.requestFactory.addIndex(extractor, ordered, comparator)
    return new Promise((resolve, reject) => {
      self.client.addIndex(request, this.callOptions(), (err: ServiceError | null) => {
        self.resolveValue(resolve, reject, err)
      })
    })
  }

  entrySet (): RemoteSet<MapEntry<K, V>>;

  entrySet (filter: Filter, comp?: Comparator): Promise<Set<MapEntry<K, V>>>;

  entrySet (filter?: Filter, comp?: Comparator): RemoteSet<MapEntry<K, V>> | Promise<Set<MapEntry<K, V>>> {
    const self = this
    if (!filter) {
      return new EntrySet(this)
    }

    const set = new Set<MapEntry<K, V>>()
    const request = this.requestFactory.entrySet(filter, comp)
    const call = self.client.entrySet(request, this.callOptions())

    return new Promise((resolve, reject) => {
      call.on(RequestStateEvent.DATA, function (e: GrpcEntry) {
        const entry = new NamedCacheEntry<K, V>(e.getKey_asU8(), e.getValue_asU8(), self.getRequestFactory().getSerializer())
        set.add(entry)
      })
      call.on(RequestStateEvent.COMPLETE, () => resolve(set))
      call.on(RequestStateEvent.ERROR, (e) => {
        reject(e)
      })
    })
  }

  keySet (): RemoteSet<K>;

  keySet (filter: Filter, comparator?: Comparator): Promise<Set<K>>;

  keySet (filter?: Filter, comparator?: Comparator): RemoteSet<K> | Promise<Set<K>> {
    const self = this
    if (!filter) {
      return new KeySet(this)
    }

    const set = new Set<K>()
    const request = this.requestFactory.keySet(filter)
    const call = self.client.keySet(request, this.callOptions())

    return new Promise((resolve, reject) => {
      call.on(RequestStateEvent.DATA, function (r: BytesValue) {
        const k = self.getRequestFactory().getSerializer().deserialize(r.getValue_asU8())
        if (k) {
          set.add(k)
        }
      })
      call.on(RequestStateEvent.COMPLETE, () => resolve(set))
      call.on(RequestStateEvent.ERROR, (e) => {
        reject(e)
      })
    })
  }

  // TODO(rlubke) missing interface definitions
  values (): RemoteSet<V>;

  values (filter: Filter, comparator?: Comparator): Promise<Set<V>>;

  values (filter?: Filter, comparator?: Comparator): RemoteSet<V> | Promise<Set<V>> {
    const self = this
    if (!filter) {
      return new ValueSet(this)
    }

    const set = new Set<V>()
    const request = this.requestFactory.values(filter, comparator)
    const call = self.client.values(request, this.callOptions())

    return new Promise((resolve, reject) => {
      call.on(RequestStateEvent.DATA, function (b: BytesValue) {
        set.add(self.getRequestFactory().getSerializer().deserialize(b.getValue_asU8()))
      })
      call.on(RequestStateEvent.COMPLETE, () => resolve(set))
      call.on(RequestStateEvent.ERROR, (e) => {
        reject(e)
      })
    })
  }

  removeIndex<T, E> (extractor: ValueExtractor<T, E>): Promise<void> {
    const self = this
    const request = this.requestFactory.removeIndex(extractor)
    return new Promise((resolve, reject) => {
      self.client.removeIndex(request, (err: ServiceError | null) => {
        self.resolveValue(resolve, reject, err)
      })
    })
  }

  // ----- RemoteMap interface ----------------------------------------------

  clear (): Promise<void> {
    const self = this
    return new Promise((resolve, reject) => {
      self.client.clear(self.requestFactory.clear(), this.callOptions(), (err: ServiceError | null) => {
        self.resolveValue(resolve, reject, err)
      })
    })
  }

  containsKey (key: K): Promise<boolean> {
    const self = this
    const request = self.requestFactory.containsKey(key)
    return new Promise((resolve, reject) => {
      self.client.containsKey(request, this.callOptions(), (err, resp) => {
        self.resolveValue(resolve, reject, err, () => resp ? resp.getValue() : resp)
      })
    })
  }

  containsValue (value: V): Promise<boolean> {
    const self = this
    const request = this.requestFactory.containsValue(value)
    return new Promise((resolve, reject) => {
      self.client.containsValue(request, this.callOptions(), (err, resp) => {
        self.resolveValue(resolve, reject, err, () => resp ? resp.getValue() : resp)
      })
    })
  }

  /**
   * @inheritDoc
   */
  get (key: K): Promise<V | null> {
    return this.getOrDefault(key, null)
  }

  getAll (keys: Iterable<K>): Promise<Map<K, V>> {
    const self = this
    const result: Map<K, V> = new Map<K, V>()
    const call = self.client.getAll(self.requestFactory.getAll(keys), this.callOptions())
    return this.doInvokeAll(call, result)
  }

  async getOrDefault (key: K, defaultValue: V | null): Promise<V | null> {
    const self = this
    return new Promise((resolve, reject) => {
      self.client.get(self.requestFactory.get(key), this.callOptions(), (err, resp) => {
        if (resp && resp.getPresent()) {
          self.resolveValue(resolve, reject, err, () => resp ? self.toValue(resp.getValue_asU8()) : resp)
        } else {
          resolve(defaultValue)
        }
      })
    })
  }

  isEmpty (): Promise<boolean> {
    const self = this
    return new Promise((resolve, reject) => {
      const request = new IsEmptyRequest()
      request.setCache(this.cacheName)
      self.client.isEmpty(request, this.callOptions(), (err, resp) => {
        self.resolveValue(resolve, reject, err, () => resp ? resp.getValue() : resp)
      })
    })
  }

  put (key: K, value: V, ttl?: number): Promise<V> {
    const self = this
    return new Promise((resolve, reject) => {
      self.client.put(self.requestFactory.put(key, value, ttl), this.callOptions(), (err, resp) => {
        self.resolveValue(resolve, reject, err, () => resp ? self.toValue(resp.getValue_asU8()) : resp)
      })
    })
  }

  putIfAbsent (key: K, value: V, ttl?: number): Promise<V> {
    const self = this
    const request = self.requestFactory.putIfAbsent(key, value, ttl)
    return new Promise((resolve, reject) => {
      self.client.putIfAbsent(request, this.callOptions(), (err, resp) => {
        self.resolveValue(resolve, reject, err, () => resp ? self.toValue(resp.getValue_asU8()) : resp)
      })
    })
  }

  remove (key: K): Promise<V> {
    const self = this
    return new Promise((resolve, reject) => {
      self.client.remove(this.requestFactory.remove(key), this.callOptions(), (err, resp) => {
        self.resolveValue(resolve, reject, err, () => resp ? self.toValue(resp.getValue_asU8()) : resp)
      })
    })
  }

  removeMapping (key: K, value: V): Promise<boolean> {
    const self = this
    const request = this.requestFactory.removeMapping(key, value)
    return new Promise((resolve, reject) => {
      self.client.removeMapping(request, this.callOptions(), (err, resp) => {
        self.resolveValue(resolve, reject, err, () => resp ? resp.getValue() : resp)
      })
    })
  }

  replace (key: K, value: V): Promise<V> {
    const self = this
    const request = this.requestFactory.replace(key, value)
    return new Promise((resolve, reject) => {
      self.client.replace(request, this.callOptions(), (err, resp) => {
        self.resolveValue(resolve, reject, err, () => resp ? self.toValue(resp.getValue_asU8()) : resp)
      })
    })
  }

  replaceMapping (key: K, value: V, newValue: V): Promise<boolean> {
    const self = this
    const request = this.requestFactory.replaceMapping(key, value, newValue)

    return new Promise((resolve, reject) => {
      self.client.replaceMapping(request, this.callOptions(), (err, resp) => {
        self.resolveValue(resolve, reject, err, () => resp ? resp.getValue() : resp)
      })
    })
  }

  size (): Promise<number> {
    return new Promise((resolve, reject) => {
      const request = new SizeRequest()
      request.setCache(this.cacheName)
      this.client.size(request, this.callOptions(), (err, resp) => {
        if (err || !resp) {
          reject(err)
        } else {
          resolve(resp.getValue())
        }
      })
    })
  }

  // ----- NamedCache interface ---------------------------------------------

  destroy (): Promise<void> {
    const self = this

    if (this.isActive()) {
      return new Promise((resolve, reject) => {
        // Note that this listener will be after the default listeners
        // that were setup in the constructor. So once this receives
        // the event, we can be sure that *all other* listeners have
        // be notified!!
        self.internalEmitter.once(CacheLifecycleEvent.DESTROYED, () => resolve())

        // Now that we have setup our 'once & only once' listener, we
        // can now send out the 'truncate' request. The handleResponse()
        // method will generate the appropriate event on the internalEmitter
        // for which our 'once & only once' listener is setup.
        const request = self.requestFactory.destroy()
        self.client.destroy(request, self.callOptions(), (err: ServiceError | null) => {
          if (err) {
            reject(err)
          }
        })
      })
    }

    return Promise.resolve()
  }

  getCacheName (): string {
    return this.cacheName
  }

  isActive (): boolean {
    return this.state == CacheState.ACTIVE
  }

  release (): Promise<void> {
    const self = this
    return new Promise((resolve) => {
      // Note that this listener will be after the default listeners
      // that were setup in the constructor. So once this receives
      // the event, we can be sure that *all other* listeners have
      // be notified!!
      self.internalEmitter.once(CacheLifecycleEvent.RELEASED, () => resolve())

      // Now that we have setup our 'once & only once' listener, we
      // can emit the CacheLifecycleEvent.RELEASED event on the internalEmitter
      // for which our 'once & only once' listener is setup.
      self.internalEmitter.emit(CacheLifecycleEvent.RELEASED, self.cacheName)
    })
  }

  truncate (): Promise<void> {
    const self = this
    return new Promise((resolve, reject) => {
      // Note that this listener will be after the default listeners
      // that were setup in the constructor. So once this receives
      // the event, we can be sure that *all other* listeners have
      // be notified!!
      self.internalEmitter.once(CacheLifecycleEvent.TRUNCATED, () => {
        resolve()
      })

      // Now that we have setup our 'once & only once' listener, we
      // can now send out the 'truncate' request. The handleResponse()
      // method will generate the appropriate event on the internalEmitter
      // for which our 'once & only once' listener is setup.
      const request = new TruncateRequest()
      request.setCache(this.cacheName)
      this.client.truncate(request, this.callOptions(), (err, resp) => {
        if (err || !resp) {
          reject(err)
        }
      })
    })
  }

  // ----- ConcurrentMap interface -----------------------------------------

  lock (key: any, cWait?: number | undefined): boolean {
    throw new Error('Method not implemented in services.proto')
  }

  unlock (key: any): boolean {
    throw new Error('Method not implemented in services.proto')
  }

  // ----- helper functions -------------------------------------------------

  /**
   * Return the per-call options.
   *
   * @return the per-call options
   */
  protected callOptions (): object {
    return {
      deadline: Date.now() + this.sessOpts.requestTimeoutInMillis
    }
  }

  /**
   * Obtain the next page of entries from the cache.
   *
   * @param cookie  an opaque cookie for page tracking
   *
   * @return a {@link ClientReadableStream} to read entries from
   */
  nextEntrySetPage (cookie: Uint8Array | string | undefined): ClientReadableStream<EntryResult> {
    return this.client.nextEntrySetPage(this.requestFactory.pageRequest(cookie), this.callOptions())
  }

  /**
   * Obtain the next page of keys from the cache.
   *
   * @param cookie  an opaque cookie for page tracking
   *
   * @return a {@link ClientReadableStream} to read keys from
   */
  nextKeySetPage (cookie: Uint8Array | string | undefined): ClientReadableStream<BytesValue> {
    return this.client.nextKeySetPage(this.requestFactory.pageRequest(cookie), this.callOptions())
  }

  /**
   * Initialize event handlers for this client.
   *
   */
  protected setupEventHandlers () {
    const self = this
    self.internalEmitter.on(CacheLifecycleEvent.DESTROYED, (cacheName: string) => {
      if (cacheName == self.cacheName) {
        self.mapEventsHandler.closeEventStream()
        self.state = CacheState.DESTROYED
        self.emit(CacheLifecycleEvent.DESTROYED, cacheName) // notify NamedCacheClient level listeners
      }
    })

    self.internalEmitter.on(CacheLifecycleEvent.TRUNCATED, (cacheName: string) => {
      if (cacheName == self.cacheName) {
        self.emit(CacheLifecycleEvent.TRUNCATED, cacheName) // notify NamedCacheClient level listeners
      }
    })

    self.internalEmitter.on(CacheLifecycleEvent.RELEASED, (cacheName: string) => {
      if (cacheName == self.cacheName) {
        self.mapEventsHandler.closeEventStream()
        self.state = CacheState.RELEASED
        self.emit(CacheLifecycleEvent.RELEASED, cacheName, this.serializer.format()) // notify NamedCacheClient level listeners
      }
    })
  }

  /**
   * Resolve a promise.
   *
   * @param resolve  resolution callback handler
   * @param reject   failure callback handler
   * @param err      raised error, if any
   * @param fn       callback for obtaining a resolution value
   *
   */
  protected resolveValue<T> (resolve: (value?: T | PromiseLike<T>) => void,
                             reject: (reason?: any) => void,
                             err?: ServiceError | null,
                             fn?: () => T | undefined) {
    if (err) {
      reject(err)
    } else {
      return fn ? resolve(fn()) : resolve()
    }
  }

  /**
   * Deserializes the provided bytes.
   *
   * @param value  bytes to decode
   *
   * @return the deserialized value
   */
  protected toValue<V> (value: Uint8Array): V {
    return (value && value.length > 0)
      ? this.getRequestFactory().getSerializer().deserialize(value)
      : null
  }

  /**
   * Helper function for invokeAll calls.
   *
   * @param call    gRPC call/event emitter
   * @param result  the map to store the result of the call
   *
   * @return a `Promise` eventually resolving to Map containing the results of
   *         performing the invokeAll operation
   */
  protected doInvokeAll<T = any>(call: EventEmitter, result: Map<K, T>): Promise<Map<K, T>> {
    const self = this

    return new Promise((resolve, reject) => {
      call.on(RequestStateEvent.DATA, function (e: Entry) {
        const key = self.getRequestFactory().getSerializer().deserialize(e.getKey_asU8())
        const value = self.getRequestFactory().getSerializer().deserialize(e.getValue_asU8())
        result.set(key, value)
      })
      call.on(RequestStateEvent.COMPLETE, () => {
        resolve(result)
      })
      call.on(RequestStateEvent.ERROR, (e) => {
        reject(e)
      })
    })
  }
}
