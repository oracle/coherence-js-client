/*
 * Copyright (c) 2020, 2022 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * https://oss.oracle.com/licenses/upl.
 */

import {ClientReadableStream, Deadline, Metadata, ServiceError} from '@grpc/grpc-js'
import { EventEmitter } from 'events'
import { BytesValue } from 'google-protobuf/google/protobuf/wrappers_pb'
import { aggregator } from './aggregators'

import { event } from './events'
import { extractor } from './extractors'
import { filter, Filters } from './filters'

import {
  Entry,
  Entry as GrpcEntry,
  EntryResult,
  IsEmptyRequest,
  SizeRequest,
  TruncateRequest
} from './grpc/messages_pb'
import { NamedCacheServiceClient } from './grpc/services_grpc_pb'
import { processor } from './processors'
import { Session } from './session'
import { util } from './util'
import AbstractDoubleAggregator = aggregator.AbstractDoubleAggregator
import EntryAggregator = aggregator.EntryAggregator
import PriorityAggregator = aggregator.PriorityAggregator
import MapEventsManager = event.MapEventsManager
import MapLifecycleEvent = event.MapLifecycleEvent
import RequestStateEvent = event.RequestStateEvent
import ValueExtractor = extractor.ValueExtractor
import Filter = filter.Filter
import MapEventFilter = filter.MapEventFilter
import EntryProcessor = processor.EntryProcessor
import Comparator = util.Comparator
import EntrySet = util.EntrySet
import HashMap = util.HashMap
import isIterableType = util.isIterableType
import KeySet = util.KeySet
import LocalSet = util.LocalSet
import NamedCacheEntry = util.NamedCacheEntry
import RemoteSet = util.RemoteSet
import RequestFactory = util.RequestFactory
import Serializer = util.Serializer
import ValueSet = util.ValueSet

/**
 * A Map-based data-structure that manages entries across one or more processes.
 * Entries are typically managed in memory, and are often comprised of data
 * that is also stored persistently, on disk.
 *
 * @typeParam K  the type of the map entry keys
 * @typeParam V  the type of the map entry values
 *
 */
export interface NamedMap<K, V> {

  /**
   * Signifies the number of key-value mappings in this map.
   *
   * @return the number of key-value mappings in this map
   */
  readonly size: Promise<number>

  /**
   * `true` if this cache is active.
   */
  readonly active: boolean

  /**
   * `true` if this cache has been released
   */
  readonly released: boolean

  /**
   * `true` if this map contains no key-value mappings.
   */
  readonly empty: Promise<boolean>

  /**
   * The name of this `NamedMap`.
   */
  readonly name: string

  /**
   * Signifies if this `NamedMap` has been destroyed.
   */
  readonly destroyed: boolean

  /**
   * Release and destroy this cache.
   * <p>
   * Warning: This method is used to completely destroy the specified cache
   * across the cluster. All references in the entire cluster to this cache
   * will be invalidated, the cached data will be cleared, and all resources
   * will be released.
   */
  destroy (): Promise<void>

  /**
   * Get all the specified keys, if they are in the map. For each key that is in the map,
   * that key and its corresponding value will be placed in the map that is returned by
   * this method. The absence of a key in the returned map indicates that it was not in the cache,
   * which may imply (for caches that can load behind the scenes) that the requested data
   * could not be loaded.
   *
   * @param keys  an Iterable of keys that may be in this map
   *
   * @returns a `Promise`resolving to a Map of keys to values for the specified keys
   *          passed in `keys`
   */
  getAll (keys: Iterable<K>): Promise<Map<K, V>>

  /**
   * Clears all the mappings in the 'NamedMap'.
   *
   * @return a `Promise` which resolves once the operation is complete
   */
  clear (): Promise<void>

  /**
   * Returns `true` if the specified key is mapped a value within the cache.
   *
   * @param key  the key whose presence in this cache is to be tested
   *
   * @return a `Promise` resolving to `true` if the key is mapped
   *         to a value, or `false` if it does not
   */
  has (key: K): Promise<boolean>

  /**
   * Returns `true` if the specified key is mapped to the specified value within the cache.
   *
   * @param key   the key
   * @param value the value
   *
   * @return a `Promise` resolving to `true` if the key is mapped
   *         to the specified value, or `false` if it does not
   */
  hasEntry (key: K, value: V): Promise<boolean>

  /**
   * Returns `true` if the specified value is mapped to some key.
   *
   * @param value  the value expected to be associated with some key
   *
   * @return a `Promise` resolving to `true` if a mapping exists,
   *         or `false` if it does not
   *
   */
  hasValue (value: V): Promise<boolean>

  /**
   * Returns the value to which this cache maps the specified key.
   *
   * @param key  the key whose associated value is to be returned
   *
   * @returns a `Promise` resolving the value to which the specified key is mapped,
   *          or `null` if this map contains no mapping for the key
   */
  get (key: K): Promise<V | null>

  /**
   * Returns the value to which the specified key is mapped, or the specified `defaultValue`
   * if this map contains no mapping for the key.
   *
   * @return the value to which the specified key is mapped, or the specified `defaultValue`
   *         if this map contains no mapping for the key
   */
  getOrDefault (key: K, defaultValue: V): Promise<V | null>

  /**
   * Associates the specified value with the specified key in this map. If the
   * map previously contained a mapping for this key, the old value is replaced.
   *
   * @param key    the key with which the specified value is to be associated
   * @param value  the value to be associated with the specified key
   *
   * @return a `Promise` resolving to the previous value associated with specified key,
   *         or `null` if there was no mapping for key. A `null` return can also indicate that the map
   *         previously associated `null` with the specified key, if the implementation supports `null` values
   */
  set (key: K, value: V): Promise<V | null>

  /**
   * Copies all mappings from the specified map to this map
   *
   * @param map the map to copy from
   */
  setAll(map: Map<K, V>): Promise<void>

  /**
   * If the specified key is not already associated with a value (or is mapped to `null`) associates
   * it with the given value and returns `null`, else returns the current value.
   *
   * @param key    the key with which the specified value is to be associated
   * @param value  the value to be associated with the specified key
   *
   * @return a `Promise` resolving to the previous value associated with the specified key, or
   *         `null` if there was no mapping for the key. (A `null` return can also indicate that the map previously
   *         associated `null` with the key, if the implementation supports `null` values.)
   */
  setIfAbsent (key: K, value: V): Promise<V | null>

  /**
   * Removes the mapping for a key from this map if it is present.
   *
   * @param key  key whose mapping is to be removed from the map
   *
   * @return a `Promise`resolving to the previous value associated with key,
   *         or null if there was no mapping for key
   */
  delete (key: K): Promise<V | null>

  /**
   * Removes the entry for the specified key only if it is currently mapped to the specified value.
   *
   * @param key    key with which the specified value is associated
   * @param value  expected to be associated with the specified key
   *
   * @return a `Promise`resolving to `true` if the value was removed
   */
  removeMapping (key: K, value: V): Promise<boolean>

  /**
   * Replaces the entry for the specified key only if it is currently mapped to some value.
   *
   * @param key    key with which the specified value is associated
   * @param value  value to be associated with the specified key
   *
   * @return a `Promise` resolving to the previous value associated with the specified key,
   *         or `null` if there was no mapping for the key. (A `null` return can also indicate that the map
   *         previously associated `null` with the key, if the implementation supports `null` values.)
   */
  replace (key: K, value: V): Promise<V | null>

  /**
   * Replaces the entry for the specified key only if currently mapped to the specified value.
   *
   * @param key       key whose associated value is to be removed
   * @param oldValue  value expected to be associated with the specified key
   * @param newValue  value to be associated with the specified key
   *
   * @return a `Promise` resolving to `true` if the value was replaced
   */
  replaceMapping (key: K, oldValue: V, newValue: V): Promise<boolean>

  /**
   * Truncates the cache.  Unlike {@link clear}, this function does not generate
   * an event for each removed entry.
   *
   * @return a `Promise` which resolves once the operation is complete
   */
  truncate (): Promise<void>

  /**
   * Perform the given action for each entry selected by the specified key set
   * until all entries have been processed or the action raises an error.
   * <p>
   * Errors raised by the action are relayed to the caller.
   * <p>
   * The implementation processes each entry on the client and should only be
   * used for read-only client-side operations (such as adding map entries to
   * a UI widget, for example).
   * <p>
   * Any entry mutation caused by the specified action will not be propagated
   * to the server when this method is called on a distributed map, so it
   * should be avoided. The mutating operations on a subset of entries
   * should be implemented using {@link invokeAll}.
   *
   *
   * @param action   the action to be performed for each entry
   * @param thisArg  optional argument to be used as this when invoking the action
   */
  forEach (action: (value: V, key: K, map: NamedMap<K, V>) => void, thisArg?: any): Promise<void>

  /**
   * Perform the given action for each entry selected by the specified key set
   * until all entries have been processed or the action raises an error.
   * <p>
   * Errors raised by the action are relayed to the caller.
   * <p>
   * The implementation processes each entry on the client and should only be
   * used for read-only client-side operations (such as adding map entries to
   * a UI widget, for example).
   * <p>
   * Any entry mutation caused by the specified action will not be propagated
   * to the server when this method is called on a distributed map, so it
   * should be avoided. The mutating operations on a subset of entries
   * should be implemented using {@link invokeAll}.
   *
   * @param action   the action to be performed for each entry
   * @param keys     the keys to process these keys are not required to
   *                 exist within the Map
   * @param thisArg  optional argument to be used as this when invoking the action
   */
  forEach (action: (value: V, key: K, map: NamedMap<K, V>) => void, keys: Iterable<K>, thisArg?: any): Promise<void>

  /**
   * Perform the given action for each entry selected by the specified key set
   * until all entries have been processed or the action raises an error.
   * <p>
   * Errors raised by the action are relayed to the caller.
   * <p>
   * The implementation processes each entry on the client and should only be
   * used for read-only client-side operations (such as adding map entries to
   * a UI widget, for example).
   * <p>
   * Any entry mutation caused by the specified action will not be propagated
   * to the server when this method is called on a distributed map, so it
   * should be avoided. The mutating operations on a subset of entries
   * should be implemented using {@link invokeAll}.
   *
   * @param action   the action to be performed for each entry
   * @param filter   the filter criteria to apply to the entries
   * @param thisArg  optional argument to be used as this when invoking the action
   */
  forEach (action: (value: V, key: K, map: NamedMap<K, V>) => void, filter: Filter, thisArg?: any): Promise<void>

  /**
   * Perform an aggregating operation against the entries specified by the passed keys.
   *
   * @typeParam R  the type of value returned by the {@link EntryProcessor}
   *
   * @param keys        the Iterable of keys that specify the entries within this Map to aggregate across
   * @param aggregator  the {@link EntryAggregator} that is used to aggregate across the specified entries of this Map
   */
  aggregate<R> (keys: Iterable<K>, aggregator: EntryAggregator<K, V, R>): Promise<R>

  /**
   * Perform an aggregating operation against the set of entries that are selected by the given {@link Filter}.
   *
   * @typeParam R  the type of value returned by the {@link EntryProcessor}
   *
   * @param filter      the {@link Filter} that is used to select entries within this Map to aggregate across
   * @param aggregator  the {@link EntryAggregator} that is used to aggregate across the specified entries of this Map
   */
  aggregate<R> (filter: Filter, aggregator: EntryAggregator<K, V, R>): Promise<R>

  /**
   * Perform an aggregating operation against all the entries.
   *
   * @typeParam R  the type of value returned by the {@link EntryProcessor}
   *
   * @param aggregator  the {@link EntryAggregator} that is used to aggregate across the specified entries of this Map
   */
  aggregate<R, T, E> (aggregator: EntryAggregator<K, V, R>): Promise<R>

  /**
   * Invoke the passed {@link EntryProcessor} against the {@link Entry} specified by the
   * passed key, returning the result of the invocation.
   *
   * @typeParam R  the type of value returned by the {@link EntryProcessor}
   *
   * @param key        the key to process it is not required to exist within the Map
   * @param processor  the {@link EntryProcessor} to use to process the specified key
   *
   * @return the result of the invocation as returned from the {@link EntryProcessor}
   */
  invoke<R> (key: K, processor: EntryProcessor<K, V, R>): Promise<R | null>

  /**
   * Invoke the passed {@link EntryProcessor} against the entries specified by the
   * passed keys, returning the result of the invocation for each.
   *
   * @typeParam R  the type of value returned by the {@link EntryProcessor}
   *
   * @param processor  the {@link EntryProcessor} to use to process the specified keys
   *
   * @return a Map containing the results of invoking the {@link EntryProcessor}
   *         against each of the specified keys
   */
  invokeAll<R> (processor: EntryProcessor<K, V, R>): Promise<Map<K, R>>

  /**
   * Invoke the passed EntryProcessor against the entries specified by the passed keys,
   * returning the result of the invocation for each.
   *
   * @typeParam R  the type of value returned by the {@link EntryProcessor}
   *
   * @param keys       the keys to process these keys are not required to exist within the Map
   * @param processor  the {@link EntryProcessor} to use to process the specified keys
   */
  invokeAll<R> (keys: Iterable<K>, processor: EntryProcessor<K, V, R>): Promise<Map<K, R>>

  /**
   * Invoke the passed EntryProcessor against the set of entries that are selected by the given Filter,
   * returning the result of the invocation for each.
   * <p>
   * Unless specified otherwise, implementations will perform this operation in two steps:
   * 1. use the filter to retrieve a matching entry set
   * 2. apply the agent to every filtered entry.
   *
   * This algorithm assumes that the agent's processing does not affect the result of the specified filter evaluation,
   * since the filtering and processing could be performed in parallel on different threads. If this assumption does
   * not hold, the processor logic has to be idempotent, or at least re-evaluate the filter. This could be easily
   * accomplished by wrapping the processor with the {@link ConditionalProcessor}.
   *
   * @typeParam R  the type of value returned by the {@link EntryProcessor}
   *
   * @param filter     a {@link Filter} that results in the set of keys to be processed
   * @param processor  the {@link EntryProcessor} to use to process the specified keys
   */
  invokeAll<R> (filter: Filter, processor: EntryProcessor<K, V, R>): Promise<Map<K, R>>

  /**
   * Allows registration of a handler to be notified of cache lifecycle events.
   *
   * @param eventName  the event
   * @param handler    the event handler
   */
  on (eventName: MapLifecycleEvent.RELEASED | MapLifecycleEvent.TRUNCATED | MapLifecycleEvent.DESTROYED, handler: (cacheName: string) => void): void

  /**
   * Add a {@link MapListener} that will receive events (inserts,
   * updates, deletes) that occur against the map, with the key, old-value
   * and new-value included.
   *
   * @param listener     the {@link MapListener} to receive events
   * @param keyOrFilter  the optional the key that identifies the entry for which to raise events or a filter that
   *                     will be passed MapEvent objects to select from; a {@link MapEvent} will be delivered to the
   *                     listener only if the filter evaluates to true for that {@link MapEvent} (see {@link MapEventFilter});
   *                     `null` is equivalent to a filter that always returns `true`
   * @param isLite       optionally pass `true` to indicate that the MapEvent objects do not have to include the
   *                     old or new values in order to allow optimizations
   */
  addMapListener (listener: event.MapListener<K, V>, keyOrFilter?: K | Filter, isLite?: boolean): Promise<void>

  /**
   * Remove a standard map listener that previously signed up for all
   * events. This has the same result as the following call:
   *
   * @param listener     the {@link MapListener} to receive events
   * @param keyOrFilter  the key or filter passed to a previous addMapListener invocation
   */
  removeMapListener (listener: event.MapListener<K, V>, keyOrFilter?: K | MapEventFilter<K, V>): Promise<void>;

  /**
   * Add an index to this map.
   *
   * @remarks
   * Adds an index to this map. Example:
   * ```javascript
   * cache.addIndex(Extractors.extract('name'))
   * ```
   *
   * @param extractor   The ValueExtractor object that is used to extract
   *                    an indexable Object from a value stored in the
   *                    indexed Map. Must not be null.
   * @param ordered     true iff the contents of the indexed information
   *                    should be ordered false otherwise.
   * @param comparator  The Comparator object which imposes an ordering
   *                    on entries in the indexed map or null if the
   *                    entries' values natural ordering should be used.
   *
   * @returns            A Promise<void> that resolves when the operation
   *                     completes.
   */
  addIndex (extractor: ValueExtractor, ordered?: boolean, comparator?: Comparator): Promise<void>

  /**
   * Returns a Set view of the keys contained in this map.
   * The set is backed by the map, so changes to the map are
   * reflected in the set, and vice-versa.  If the map is modified
   * while an iteration over the set is in progress (except through
   * the iterator's own <tt>remove</tt> operation), the results of
   * the iteration are undefined.  The set supports element removal,
   * which removes the corresponding mapping from the map.
   *
   * @return a set view of the keys contained in this map
   */
  keys (): Promise<RemoteSet<K>>

  /**
   * Return a set view of the keys contained in this map for entries that
   * satisfy the criteria expressed by the filter.
   *
   * Unlike the {@link keySet()} method, the set returned by this method may
   * not be backed by the map, so changes to the set may not be reflected in the
   * map, and vice-versa.
   *
   * @param filter      the Filter object representing the criteria that the
   *                    entries of this map should satisfy
   *
   * @return a set of keys for entries that satisfy the specified criteria
   */
  keys (filter: Filter): Promise<RemoteSet<K>>

  /**
   * Returns a Set view of the mappings contained in this map.
   * The set is backed by the map, so changes to the map are
   * reflected in the set, and vice-versa.  If the map is modified
   * while an iteration over the set is in progress (except through
   * the iterator's own `remove` operation) the results of the iteration
   * are undefined.  The set supports element removal, which removes
   * the corresponding mapping from the map.
   *
   * @return a set view of the mappings contained in this map
   */
  entries (): Promise<RemoteSet<MapEntry<K, V>>>

  /**
   * Return a set view of the entries contained in this map that satisfy the
   * criteria expressed by the filter.  Each element in the returned set is a
   * {@link MapEntry}.
   *
   * Unlike the `entrySet()` method, the set returned by this method
   * may not be backed by the map, so changes to the set may not be reflected
   * in the map, and vice-versa.
   *
   * @param filter      the Filter object representing the criteria that the
   *                    entries of this map should satisfy
   * @param comparator  the {@link Comparator} object which imposes an ordering on
   *                    entries in the resulting set; or `null` if the
   *                    entries' values natural ordering should be used
   *
   * @return a set of entries that satisfy the specified criteria
   */
  entries (filter: Filter, comparator?: Comparator): Promise<RemoteSet<MapEntry<K, V>>>

  /**
   * Remove an index from this `NamedMap`.
   *
   * Removes an index to this `NamedMap`. Example:
   * ```javascript
   * cache.removeIndex(Extractors.extract('name'))
   * ```
   *
   * @param extractor  The ValueExtractor object that is used to extract
   *                   an indexable Object from a value stored in the
   *                   indexed Map. Must not be `null`.
   *
   * @return  A `Promise` that resolves when the operation completes.
   */
  removeIndex (extractor: ValueExtractor): Promise<void>

  /**
   * Returns a Set view of the values contained in this map.
   * The collection is backed by the map, so changes to the map are
   * reflected in the collection, and vice-versa.  If the map is
   * modified while an iteration over the collection is in progress
   * (except through the iterator's own `remove` operation),
   * the results of the iteration are undefined.
   *
   * @return a `Promise` that resolves to the values in the set
   */
  values (): Promise<RemoteSet<V>>

  /**
   * Return a Set of the values contained in this map that satisfy the
   * criteria expressed by the filter.
   * <p>
   * Unlike the `values()` method, the collection returned by this
   * method may not be backed by the map, so changes to the collection may not
   * be reflected in the map, and vice-versa.
   *
   * @param filter     the {@link Filter} object representing the criteria that the
   *                   entries of this map should satisfy
   * @param comparator the {@link Comparator} object which imposes an ordering on
   *                   entries in the resulting set; or <tt>null</tt> if the
   *                   entries' values natural ordering should be used
   *
   * @return a `Promise` that resolves to the values in the set that satisfy
   *         the specified criteria
   */
  values (filter: Filter, comparator?: Comparator): Promise<RemoteSet<V>>

  /**
   * Release local resources associated with instance.
   */
  release (): Promise<void>
}

/**
 * A map entry (key-value pair).
 */
export interface MapEntry<K, V> {

  /**
   * Returns the key corresponding to this entry.
   *
   * @return the key corresponding to this entry
   */
  key: K

  /**
   * Returns the value corresponding to this entry.
   *
   * @return the value corresponding to this entry
   */
  value: V
}

/**
 * A Map-based data-structure that manages entries across one or more processes.
 * Entries are typically managed in memory, and are often comprised of data
 * that is also stored in an external system, for example a database, or data
 * that has been assembled or calculated at some significant cost.  Such
 * entries are referred to as being <i>cached</i>.
 *
 * @typeParam K  the type of the map entry keys
 * @typeParam V  the type of the map entry values
 */
export interface NamedCache<K, V> extends NamedMap<K, V> {

  /**
   * Associates the specified value with the specified key in this map. If the
   * map previously contained a mapping for this key, the old value is replaced.
   *
   * @param key    the key with which the specified value is to be associated
   * @param value  the value to be associated with the specified key
   * @param ttl    the expiry time in millis (optional)
   *
   * @return a `Promise` resolving to the previous value associated with specified key,
   *         or `null` if there was no mapping for key. A `null` return can also indicate that the map
   *         previously associated `null` with the specified key, if the implementation supports `null` values
   */
  set (key: K, value: V, ttl?: number): Promise<V | null>;

  /**
   * If the specified key is not already associated with a value (or is mapped to null) associates
   * it with the given value and returns `nul`l, else returns the current value.
   *
   * @param key    the key with which the specified value is to be associated
   * @param value  the value to be associated with the specified key
   * @param ttl    the expiry time in millis
   *
   * @return a `Promise` resolving to the previous value associated with the specified key, or
   *         `null` if there was no mapping for the key. (A `null` return can also indicate that the map previously
   *         associated `null` with the key, if the implementation supports `null` values.)
   */
  setIfAbsent (key: K, value: V, ttl?: number): Promise<V | null>
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
 * 1. {@link MapLifecycleEvent.DESTROYED}: when the underlying cache is destroyed
 * 2. {@link MapLifecycleEvent.TRUNCATED}: when the underlying cache is truncated
 * 3. {@link MapLifecycleEvent.RELEASED}: when the underlying cache is released
 *
 * @typeParam K  the type of the cache keys
 * @typeParam V  the type of the cache values
 */
export class NamedCacheClient<K = any, V = any>
  extends EventEmitter
  implements NamedCache<K, V> {

  /**
   * @internal
   * The session with the remote Coherence cluster.
   */
  private readonly session: Session
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
    this.serializer = serializer

    this.requestFactory = new RequestFactory(this.cacheName, this.session.scope, this.serializer)
    this.client = new NamedCacheServiceClient(
      session.address, // Ignored since we are using a shared Channel
      session.channelCredentials,
      session.clientOptions) // shared channel defined here

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
    this.mapEventsHandler = new MapEventsManager(this as NamedMap<K, V>,
        this.session, this.client, this.serializer, this.internalEmitter)
  }

  /**
   * @internal
   * Flag to track released state.
   */
  private _released: boolean = false

  /**
   * @inheritDoc
   */
  get released () {
    return this._released
  }

  // ----- public functions -------------------------------------------------

  /**
   * @internal
   * Flag to track destroyed state.
   */
  private _destroyed: boolean = false

  /**
   * @inheritDoc
   */
  get destroyed () {
    return this._destroyed
  }

  /**
   * @inheritDoc
   */
  get empty (): Promise<boolean> {
    const self = this
    return this.promisify((resolve, reject) => {
      const request = new IsEmptyRequest()
      request.setCache(this.cacheName)
      self.client.isEmpty(request, new Metadata(), this.session.callOptions(), (err, resp) => {
        // @ts-ignore
        self.resolveValue(resolve, reject, err, () => resp ? resp.getValue() : resp)
      })
    })
  }

  /**
   * @inheritDoc
   */
  get size () {
    return this.promisify<number>((resolve, reject) => {
      const request = new SizeRequest()
      request.setCache(this.cacheName)
      this.client.size(request, new Metadata(), this.session.callOptions(), (err, resp) => {
        if (err || !resp) {
          reject(err)
        } else {
          resolve(resp.getValue())
        }
      })
    })
  }

  /**
   * @inheritDoc
   */
  get name () {
    return this.cacheName
  }

  /**
   * @inheritDoc
   */
  get active () {
    return !this.released && !this.destroyed
  }

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
   * @inheritDoc
   */
  hasEntry (key: K, value: V): Promise<boolean> {
    const self = this
    return this.promisify((resolve, reject) => {
      const request = self.requestFactory.containsEntry(key, value)
      self.client.containsEntry(request, new Metadata(), this.session.callOptions(), (err, resp) => {
        // @ts-ignore
        self.resolveValue(resolve, reject, err, () => resp ? resp.getValue() : resp)
      })
    })
  }

  /**
   * @inheritDoc
   */
  aggregate<R = any> (kfa: Iterable<K> | Filter | EntryAggregator<K, V, R>, agg?: EntryAggregator<K, V, R>): Promise<any> {
    const self = this
    const request = this.requestFactory.aggregate(kfa, agg)

    let numericReturn = (kfa instanceof AbstractDoubleAggregator || agg instanceof AbstractDoubleAggregator)
    if (kfa instanceof PriorityAggregator) {
      numericReturn = (kfa as any).aggregator instanceof AbstractDoubleAggregator
    }
    if (agg instanceof PriorityAggregator) {
      numericReturn = (agg as any).aggregator instanceof AbstractDoubleAggregator
    }

    return this.promisify((resolve, reject) => {
      self.client.aggregate(request, new Metadata(), this.session.callOptions(), (err, resp) => {
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
          if (numericReturn && typeof result === 'string') {
              result = Number(result)
          }
          resolve(result)
        }
      })
    })
  }

  /**
   * @inheritDoc
   */
  invoke<R = any> (key: K, processor: EntryProcessor<K, V, R>): Promise<R | null> {
    const self = this
    return this.promisify((resolve, reject) => {
      self.client.invoke(self.requestFactory.invoke(key, processor), (err, resp) => {
        if (err) {
          reject(err)
        } else {
          // @ts-ignore
          self.resolveValue(resolve, reject, err, () => resp ? self.toValue(resp.getValue_asU8()) : resp)
        }
      })
    })
  }

  /**
   * @inheritDoc
   */
  invokeAll<R = any> (keysOrFilterOrProcessor: Iterable<K> | Filter | EntryProcessor<K, V, R>, processor?: EntryProcessor<K, V, R>): Promise<Map<K, R>> {
    const self = this
    let keysOrFilter: Iterable<K> | Filter
    if (processor) {
      // Two args invocation
      if (keysOrFilterOrProcessor instanceof Filter) {
        keysOrFilter = keysOrFilterOrProcessor
      } else if (isIterableType(keysOrFilterOrProcessor)) {
        keysOrFilter = keysOrFilterOrProcessor
      } else {
        throw new Error('invokeAll() takes only one processor as argument')
      }
    } else {
      // One arg (which is a EntryProcessor)
      keysOrFilter = Filters.always()
      processor = keysOrFilterOrProcessor as EntryProcessor
    }

    const call = self.client.invokeAll(self.requestFactory.invokeAll(keysOrFilter, processor), this.session.callOptions())
    return this.doInvokeAll(call)
  }

  forEach (action: (value: V, key: K, map: NamedMap<K, V>) => void, thisArg?: any): Promise<void>
  forEach (action: (value: V, key: K, map: NamedMap<K, V>) => void, keys: Iterable<K>, thisArg?: any): Promise<void>
  forEach (action: (value: V, key: K, map: NamedMap<K, V>) => void, filter: filter.Filter, thisArg?: any): Promise<void>
  forEach (action: ((value: V, key: K, map: NamedMap<K, V>) => void), keysOrFilter?: Iterable<K> | filter.Filter, thisArg?: any): Promise<void> {
    if (thisArg) {
      action.bind(thisArg)
    }
    if (keysOrFilter) {
      if (util.isIterableType(keysOrFilter)) {
        return this.promisify((resolve, reject) => {
          this.getAll(keysOrFilter as Iterable<K>)
            .then(entries => entries.forEach((value: V, key: K) => action(value, key, this)))
            .then(() => resolve(undefined))
            .catch(error => reject(error))
        })
      } else {
        return this.promisify((resolve, reject) => {
          this.entries(keysOrFilter as filter.Filter)
            .then(entries => {
              for (const entry of entries) {
                action(entry.value, entry.key, this)
              }
            })
            .then(() => resolve(undefined))
            .catch(error => reject(error))
        })
      }
    }
    return this.promisify((resolve, reject) => {
      this.entries(Filters.always())
        .then(entries => {
          for (const entry of entries) {
            action(entry.value, entry.key, this)
          }
        })
        .then(() => resolve(undefined))
        .catch(error => reject(error))
    })
  }

  /**
   * @inheritDoc
   */
  addMapListener (listener: event.MapListener<K, V>, keyOrFilterOrLite?: Filter | K | boolean, isLite?: boolean): Promise<void> {
    let lite = false

    if (isLite !== undefined) {
      // three args invocation
      lite = isLite
    }
    if (keyOrFilterOrLite) {
      if (keyOrFilterOrLite instanceof Filter) {
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

  /**
   * @inheritDoc
   */
  removeMapListener (listener: event.MapListener<K, V>, keyOrFilter?: MapEventFilter<K, V> | K | null): Promise<void> {
    if (keyOrFilter) {
      return (keyOrFilter instanceof MapEventFilter)
        ? this.mapEventsHandler.removeFilterListener(listener, keyOrFilter)
        : this.mapEventsHandler.removeKeyListener(listener, keyOrFilter)
    }
    return this.mapEventsHandler.removeFilterListener(listener, null)
  }

  /**
   * @inheritDoc
   */
  addIndex (extractor: ValueExtractor, ordered?: boolean, comparator?: Comparator): Promise<void> {
    const self = this
    const request = this.requestFactory.addIndex(extractor, ordered, comparator)
    return this.promisify((resolve, reject) => {
      self.client.addIndex(request, new Metadata(), this.session.callOptions(), (err: ServiceError | null) => {
        self.resolveValue(resolve, reject, err)
      })
    })
  }

  /**
   * @inheritDoc
   */
  entries (filter?: Filter, comp?: Comparator): Promise<RemoteSet<MapEntry<K, V>>> {
    const self = this
    if (!filter) {
      return Promise.resolve(new EntrySet(this))
    }

    const set = new LocalSet<MapEntry<K, V>>()
    const request = this.requestFactory.entrySet(filter, comp)
    const call = self.client.entrySet(request, this.session.callOptions())

    return this.promisify((resolve, reject) => {
      call.on(RequestStateEvent.DATA, function (e: GrpcEntry) {
        const entry = new NamedCacheEntry<K, V>(e.getKey_asU8(), e.getValue_asU8(), self.getRequestFactory().serializer)
        set.add(entry)
      })
      call.on(RequestStateEvent.COMPLETE, () => resolve(set))
      call.on(RequestStateEvent.ERROR, (e) => {
        reject(e)
      })
    })
  }

  /**
   * @inheritDoc
   */
  keys (filter?: Filter): Promise<RemoteSet<K>> {
    const self = this
    if (!filter) {
      return Promise.resolve(new KeySet(this))
    }

    const set = new LocalSet<K>()
    const request = this.requestFactory.keySet(filter)
    const call = self.client.keySet(request, this.session.callOptions())

    return this.promisify((resolve, reject) => {
      call.on(RequestStateEvent.DATA, function (r: BytesValue) {
        const k = self.getRequestFactory().serializer.deserialize(r.getValue_asU8())
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

  /**
   * @inheritDoc
   */
  removeIndex (extractor: ValueExtractor): Promise<void> {
    const self = this
    const request = this.requestFactory.removeIndex(extractor)
    return this.promisify((resolve, reject) => {
      self.client.removeIndex(request, (err: ServiceError | null) => {
        self.resolveValue(resolve, reject, err)
      })
    })
  }

  /**
   * @inheritDoc
   */
  values (filter?: Filter, comparator?: Comparator): Promise<RemoteSet<V>> {
    const self = this
    if (!filter) {
      return Promise.resolve(new ValueSet(this))
    }

    const set = new LocalSet<V>()
    const request = this.requestFactory.values(filter, comparator)
    const call = self.client.values(request, this.session.callOptions())

    return this.promisify((resolve, reject) => {
      call.on(RequestStateEvent.DATA, function (b: BytesValue) {
        set.add(self.getRequestFactory().serializer.deserialize(b.getValue_asU8()))
      })
      call.on(RequestStateEvent.COMPLETE, () => resolve(set))
      call.on(RequestStateEvent.ERROR, (e) => {
        reject(e)
      })
    })
  }

  /**
   * @inheritDoc
   */
  clear (): Promise<void> {
    const self = this
    return this.promisify((resolve, reject) => {
      self.client.clear(self.requestFactory.clear(), new Metadata(), this.session.callOptions(), (err: ServiceError | null) => {
        self.resolveValue(resolve, reject, err)
      })
    })
  }

  /**
   * @inheritDoc
   */
  has (key: K): Promise<boolean> {
    const self = this
    const request = self.requestFactory.containsKey(key)
    return this.promisify((resolve, reject) => {
      self.client.containsKey(request, new Metadata(), this.session.callOptions(), (err, resp) => {
        // @ts-ignore
        self.resolveValue(resolve, reject, err, () => resp ? resp.getValue() : resp)
      })
    })
  }

  /**
   * @inheritDoc
   */
  hasValue (value: V): Promise<boolean> {
    const self = this
    const request = this.requestFactory.containsValue(value)
    return this.promisify((resolve, reject) => {
      self.client.containsValue(request, new Metadata(), this.session.callOptions(), (err, resp) => {
        // @ts-ignore
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

  /**
   * @inheritDoc
   */
  getAll (keys: Iterable<K>): Promise<Map<K, V>> {
    const self = this
    const call = self.client.getAll(self.requestFactory.getAll(keys), this.session.callOptions())
    return this.doInvokeAll(call)
  }

  /**
   * @inheritDoc
   */
  getOrDefault (key: K, defaultValue: V | null): Promise<V | null> {
    const self = this
    return this.promisify((resolve, reject) => {
      self.client.get(self.requestFactory.get(key), new Metadata(), this.session.callOptions(), (err, resp) => {
        if (resp && resp.getPresent()) {
          // @ts-ignore
          self.resolveValue(resolve, reject, err, () => resp ? self.toValue(resp.getValue_asU8()) : resp)
        } else {
          resolve(defaultValue)
        }
      })
    })
  }

  /**
   * @inheritDoc
   */
  set (key: K, value: V, ttl?: number): Promise<V> {
    const self = this
    return this.promisify((resolve, reject) => {
      self.client.put(self.requestFactory.put(key, value, ttl), new Metadata(), this.session.callOptions(), (err, resp) => {
        // @ts-ignore
        self.resolveValue(resolve, reject, err, () => resp ? self.toValue(resp.getValue_asU8()) : resp)
      })
    })
  }

  /**
   * @inheritDoc
   */
  setAll (map: Map<K, V>): Promise<void> {
    const self = this
    return this.promisify((resolve, reject) => {
      self.client.putAll(self.requestFactory.putAll(map), new Metadata(), this.session.callOptions(), (err: ServiceError | null) => {
        self.resolveValue(resolve, reject, err)
      })
    })
  }

  /**
   * @inheritDoc
   */
  setIfAbsent (key: K, value: V, ttl?: number): Promise<V> {
    const self = this
    const request = self.requestFactory.putIfAbsent(key, value, ttl)
    return this.promisify((resolve, reject) => {
      self.client.putIfAbsent(request, new Metadata(), this.session.callOptions(), (err, resp) => {
        // @ts-ignore
        self.resolveValue(resolve, reject, err, () => resp ? self.toValue(resp.getValue_asU8()) : resp)
      })
    })
  }

  /**
   * @inheritDoc
   */
  delete (key: K): Promise<V> {
    const self = this
    return this.promisify((resolve, reject) => {
      self.client.remove(this.requestFactory.remove(key), new Metadata(), this.session.callOptions(), (err, resp) => {
        // @ts-ignore
        self.resolveValue(resolve, reject, err, () => resp ? self.toValue(resp.getValue_asU8()) : resp)
      })
    })
  }

  /**
   * @inheritDoc
   */
  removeMapping (key: K, value: V): Promise<boolean> {
    const self = this
    const request = this.requestFactory.removeMapping(key, value)
    return this.promisify((resolve, reject) => {
      self.client.removeMapping(request, new Metadata(), this.session.callOptions(), (err, resp) => {
        // @ts-ignore
        self.resolveValue(resolve, reject, err, () => resp ? resp.getValue() : resp)
      })
    })
  }

  /**
   * @inheritDoc
   */
  replace (key: K, value: V): Promise<V> {
    const self = this
    const request = this.requestFactory.replace(key, value)
    return this.promisify((resolve, reject) => {
      self.client.replace(request, new Metadata(), this.session.callOptions(), (err, resp) => {
        // @ts-ignore
        self.resolveValue(resolve, reject, err, () => resp ? self.toValue(resp.getValue_asU8()) : resp)
      })
    })
  }

  /**
   * @inheritDoc
   */
  replaceMapping (key: K, value: V, newValue: V): Promise<boolean> {
    const self = this
    const request = this.requestFactory.replaceMapping(key, value, newValue)

    return this.promisify((resolve, reject) => {
      self.client.replaceMapping(request, new Metadata(), this.session.callOptions(), (err, resp) => {
        // @ts-ignore
        self.resolveValue(resolve, reject, err, () => resp ? resp.getValue() : resp)
      })
    })
  }

  /**
   * @inheritDoc
   */
  destroy (): Promise<void> {
    const self = this

    if (this.active) {
      return this.promisify((resolve, reject) => {
        // Note that this listener will be after the default listeners
        // that were registered in the constructor. So once this receives
        // the event, we can be sure that *all other* listeners have
        // be notified!!
        self.internalEmitter.once(MapLifecycleEvent.DESTROYED, () => resolve())

        // Now that we have registered our 'once & only once' listener, we
        // can now send out the 'truncate' request. The handleResponse()
        // method will generate the appropriate event on the internalEmitter
        // for which our 'once & only once' listener is registered.
        const request = self.requestFactory.destroy()
        self.client.destroy(request, new Metadata(), self.session.callOptions(), async (err: ServiceError | null) => {
          if (err) {
            reject(err)
          }
        })
      })
    }

    return Promise.resolve()
  }

  /**
   * @inheritDoc
   */
  release (): Promise<void> {
    const self = this
    return this.promisify((resolve) => {
      // Note that this listener will be after the default listeners
      // that were registered in the constructor. So once this receives
      // the event, we can be sure that *all other* listeners have
      // be notified!!
      self.internalEmitter.once(MapLifecycleEvent.RELEASED, () => resolve())

      // Now that we have registered our 'once & only once' listener, we
      // can emit the MapLifecycleEvent.RELEASED event on the internalEmitter
      // for which our 'once & only once' listener is registered.
      self.internalEmitter.emit(MapLifecycleEvent.RELEASED, self.cacheName)
    })
  }

  /**
   * @inheritDoc
   */
  truncate (): Promise<void> {
    const self = this
    return this.promisify((resolve, reject) => {
      // Note that this listener will be after the default listeners
      // that were registered in the constructor. So once this receives
      // the event, we can be sure that *all other* listeners have
      // be notified!!
      self.internalEmitter.once(MapLifecycleEvent.TRUNCATED, () => {
        resolve()
      })

      // Now that we have registered our 'once & only once' listener, we
      // can now send out the 'truncate' request. The handleResponse()
      // method will generate the appropriate event on the internalEmitter
      // for which our 'once & only once' listener is registered.
      const request = new TruncateRequest()
      request.setCache(this.cacheName)
      this.client.truncate(request, new Metadata(), this.session.callOptions(), (err, resp) => {
        if (err || !resp) {
          reject(err)
        }
      })
    })
  }

  // ----- helper functions -------------------------------------------------

  /**
   * Create a promise wrapping the provided execution logic. This logic will be called
   * when the `gRPC` client's channel is ready.
   *
   * @param logic execution logic
   */
  promisify<T> (logic: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void): Promise<T> {
    const self = this
    return new Promise((resolve, reject) => {
      if (!self.active) {
        let message: string = 'Cache [' + this.cacheName + '] has been ' + (this.released ? 'release.' : 'destroyed.')
        reject(new Error(message))
        }

      self.client.waitForReady(self.readyTimeout(), error => {
        if (error) {
          reject(error)
        }
        logic(resolve, reject)
      })
    })
  }

  /**
   * The deadline for a `gRPC` channel to be ready.
   */
  readyTimeout(): Deadline {
    return Date.now() + this.session.options.readyTimeoutInMillis;
  }

  /**
   * Obtain the next page of entries from the cache.
   *
   * @param cookie  an opaque cookie for page tracking
   *
   * @return a {@link ClientReadableStream} to read entries from
   */
  nextEntrySetPage (cookie: Uint8Array | string | undefined): ClientReadableStream<EntryResult> {
    return this.client.nextEntrySetPage(this.requestFactory.pageRequest(cookie), this.session.callOptions())
  }

  /**
   * Obtain the next page of keys from the cache.
   *
   * @param cookie  an opaque cookie for page tracking
   *
   * @return a {@link ClientReadableStream} to read keys from
   */
  nextKeySetPage (cookie: Uint8Array | string | undefined): ClientReadableStream<BytesValue> {
    return this.client.nextKeySetPage(this.requestFactory.pageRequest(cookie), this.session.callOptions())
  }

  /**
   * Initialize event handlers for this client.
   *
   */
  protected setupEventHandlers () {
    const self = this
    self.internalEmitter.on(MapLifecycleEvent.DESTROYED, (cacheName: string) => {
      if (cacheName == self.cacheName) {
        // noinspection JSIgnoredPromiseFromCall
        self.mapEventsHandler.closeEventStream()
        self._destroyed = true
        self.emit(MapLifecycleEvent.DESTROYED, cacheName) // notify NamedCacheClient level listeners
      }
    })

    self.internalEmitter.on(MapLifecycleEvent.TRUNCATED, (cacheName: string) => {
      if (cacheName == self.cacheName) {
        self.emit(MapLifecycleEvent.TRUNCATED, cacheName) // notify NamedCacheClient level listeners
      }
    })

    self.internalEmitter.on(MapLifecycleEvent.RELEASED, (cacheName: string) => {
      if (cacheName == self.cacheName) {
        // noinspection JSIgnoredPromiseFromCall
        self.mapEventsHandler.closeEventStream()
        self._released = true
        self.emit(MapLifecycleEvent.RELEASED, cacheName, this.serializer.format) // notify NamedCacheClient level listeners
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
      ? this.getRequestFactory().serializer.deserialize(value)
      : null
  }

  /**
   * Helper function for invokeAll calls.
   *
   * @param call    gRPC call/event emitter
   *
   * @return a `Promise` eventually resolving to Map containing the results of
   *         performing the invokeAll operation
   */
  protected doInvokeAll<T = any> (call: EventEmitter): Promise<Map<K, T>> {
    const serializer = this.getSerializer()
    const result: Map<K, T> = new HashMap<K, T>()
    return new Promise((resolve, reject) => {
      call.on(RequestStateEvent.DATA, function (e: Entry) {
        const key = serializer.deserialize(e.getKey_asU8())
        const value = serializer.deserialize(e.getValue_asU8())
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
