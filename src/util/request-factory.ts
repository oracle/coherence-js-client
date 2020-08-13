/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { EntryAggregator } from '../aggregator'
import { ValueExtractor } from '../extractor'
import { Filter, MapEventFilter } from '../filter'
import {
  AddIndexRequest,
  AggregateRequest,
  ClearRequest,
  ContainsEntryRequest,
  ContainsKeyRequest,
  ContainsValueRequest,
  DestroyRequest,
  EntrySetRequest,
  GetAllRequest,
  GetRequest,
  InvokeAllRequest,
  InvokeRequest,
  KeySetRequest,
  MapListenerRequest,
  PageRequest,
  PutIfAbsentRequest,
  PutRequest,
  RemoveIndexRequest,
  RemoveMappingRequest,
  RemoveRequest,
  ReplaceMappingRequest,
  ReplaceRequest,
  ValuesRequest
} from '../net/grpc/messages_pb'
import { EntryProcessor } from '../processor'

import { Serializer } from '../util'
import { Comparator } from './collections'
import { Util } from './util' // not exported by default

/**
 * A class to facilitate Request objects creation.
 * @hidden
 */
export class RequestFactory<K, V> {

  /**
   * The cache this `RequestFactory` will be making requests for.
   */
  protected readonly cacheName: string

  /**
   * The payload serializer.
   */
  private readonly _serializer: Serializer

  /**
   * Unique uid generation for MapListener subscriptions.
   */
  protected readonly uidPrefix: string

  /**
   * The next requestID to be used for subscribe requests.
   */
  protected nextRequestId: number = 0

  /**
   * The next filterID to be used for filter subscriptions.
   */
  protected nextFilterId: number = 0

  /**
   * Constructs a new `RequestFactory`.
   *
   * @param cacheName   the cache name
   * @param serializer  the payload serializer
   */
  constructor (cacheName: string, serializer: Serializer) {
    if (!cacheName) {
      throw new Error('cache name cannot be null or undefined')
    }
    this.cacheName = cacheName
    this._serializer = serializer
    this.uidPrefix = '-' + cacheName + '-' + Date.now() + '-'
  }

  /**
   * Return the {@link Serializer} being used by this factory.
   */
  get serializer (): Serializer {
    return this._serializer
  }

  /**
   * Creates an aggregation request.
   * This can either be called with a single argument like `aggregate(EntryAggregator)` or like
   * `aggregate(Iterable<K> | Filter<V>, Aggregator)`
   */
  aggregate<R, T, E> (kfa: Iterable<K> | Filter<V> | EntryAggregator<K, V, T, E, R>, aggregator?: EntryAggregator<K, V, T, E, R>): AggregateRequest {
    const request = new AggregateRequest()
    request.setCache(this.cacheName)
    request.setFormat(this._serializer.format)
    if (aggregator) {
      // Two args invocation
      request.setAggregator(this._serializer.serialize(aggregator))
      if (kfa instanceof Filter) {
        request.setFilter(this._serializer.serialize(kfa))
      } else {
        for (const key of (kfa as Iterable<K>)) {
          request.addKeys(this._serializer.serialize(key))
        }
      }
    } else {
      // One arg invocation
      request.setAggregator(this._serializer.serialize(kfa))
    }

    return request
  }

  /**
   * Creates an {@link AddIndexRequest}.
   */
  addIndex (extractor: ValueExtractor<any, any>, sorted?: boolean, comparator?: Comparator): AddIndexRequest {
    const request = new AddIndexRequest()

    request.setCache(this.cacheName)
    request.setFormat(this._serializer.format)
    request.setExtractor(this._serializer.serialize(extractor))
    if (sorted) {
      request.setSorted(sorted)
    }
    if (comparator) {
      request.setComparator(this._serializer.serialize(comparator))
    }

    return request
  }

  /**
   * Creates a new `RemoveIndexRequest`.
   * @param extractor
   */
  removeIndex (extractor: ValueExtractor<any, any>): RemoveIndexRequest {
    const request = new RemoveIndexRequest()

    request.setCache(this.cacheName)
    request.setFormat(this._serializer.format)
    request.setExtractor(this._serializer.serialize(extractor))

    return request
  }

  /**
   * Create a new `ClearRequest`.
   */
  clear (): ClearRequest {
    const request = new ClearRequest()
    request.setCache(this.cacheName)

    return request
  }

  /**
   * Creates a new `ContainsEntryRequest`.
   */
  containsEntry (key: K, value: V): ContainsEntryRequest {
    const request = new ContainsEntryRequest()
    request.setCache(this.cacheName)
    request.setFormat(this._serializer.format)
    request.setKey(this._serializer.serialize(key))
    if (value) {
      request.setValue(this._serializer.serialize(value))
    }

    return request
  }

  /**
   * Create a new `ContainsKeyRequest`.
   */
  containsKey (key: K): ContainsKeyRequest {
    const request = new ContainsKeyRequest()
    request.setFormat(this._serializer.format)
    request.setCache(this.cacheName)
    request.setKey(this._serializer.serialize(key))

    return request
  }

  /**
   * Create a new `ContainsValueRequest`.
   */
  containsValue (value: V): ContainsValueRequest {
    const request = new ContainsValueRequest()
    request.setFormat(this._serializer.format)
    request.setCache(this.cacheName)
    if (value) {
      request.setValue(this._serializer.serialize(value))
    }

    return request
  }

  /**
   * Create a new `GetRequest`.
   */
  get (key: K): GetRequest {
    const request = new GetRequest()
    request.setFormat(this._serializer.format)
    request.setCache(this.cacheName)
    request.setKey(this._serializer.serialize(key))

    return request
  }

  /**
   * Create a new `GetAllRequest`.
   */
  getAll (keys: Iterable<K>): GetAllRequest {
    const request = new GetAllRequest()
    request.setFormat(this._serializer.format)
    request.setCache(this.cacheName)
    for (const key of keys) {
      request.addKey(this._serializer.serialize(key))
    }

    return request
  }

  /**
   * Creates a new `EntrySetRequest`.
   */
  entrySet (filter?: Filter, comparator?: any): EntrySetRequest {
    const request = new EntrySetRequest()
    request.setFormat(this._serializer.format)
    request.setCache(this.cacheName)
    if (filter) {
      request.setFilter(this._serializer.serialize(filter))
    }
    if (comparator) {
      request.setComparator(this._serializer.serialize(comparator))
    }

    return request
  }

  /**
   * Creates a new `InvokeRequest`.
   */
  invoke<R> (key: K, processor: EntryProcessor<K, V, R>): InvokeRequest {
    const request = new InvokeRequest()
    request.setFormat(this._serializer.format)
    request.setCache(this.cacheName)
    request.setKey(this._serializer.serialize(key))
    request.setProcessor(this._serializer.serialize(processor))

    return request
  }

  /**
   * Creates a new `InvokeAllRequest`.
   */
  invokeAll<R> (keysOrFilter: Iterable<K> | Filter<V>, processor?: EntryProcessor<K, V, R>): InvokeAllRequest {
    const request = new InvokeAllRequest()
    request.setFormat(this._serializer.format)
    request.setCache(this.cacheName)
    if (Util.isIterableType(keysOrFilter)) {
      for (const key of keysOrFilter) {
        request.addKeys(this._serializer.serialize(key))
      }
    } else {
      request.setFilter(this._serializer.serialize(keysOrFilter))
    }
    request.setProcessor(this._serializer.serialize(processor))
    return request
  }

  /**
   * Creates a new `KeySetRequest`.
   */
  keySet<T> (filter?: Filter<T>): KeySetRequest {
    const request = new KeySetRequest()
    request.setFormat(this._serializer.format)
    request.setCache(this.cacheName)
    if (filter) {
      request.setFilter(this._serializer.serialize(filter))
    }
    return request
  }

  /**
   * Creates a new `PutRequest`.
   */
  put (key: K, value: V, ttl?: number): PutRequest {
    const request = new PutRequest()
    request.setFormat(this._serializer.format)
    request.setCache(this.cacheName)
    request.setKey(this._serializer.serialize(key))
    if (value) {
      request.setValue(this._serializer.serialize(value))
    }
    if (ttl) {
      request.setTtl(ttl)
    }

    return request
  }

  /**
   * Creates a new `PageRequest`.
   */
  page (cookie: Uint8Array | string): PageRequest {
    const request = new PageRequest()
    request.setFormat(this._serializer.format)
    request.setCache(this.cacheName)
    request.setCookie(cookie)

    return request
  }

  /**
   * Creates a new `PutIfAbsentRequest`.
   */
  putIfAbsent (key: K, value: V, ttl?: number): PutIfAbsentRequest {
    const request = new PutIfAbsentRequest()
    request.setFormat(this._serializer.format)
    request.setCache(this.cacheName)
    request.setKey(this._serializer.serialize(key))
    if (value) {
      request.setValue(this._serializer.serialize(value))
    }
    if (ttl) {
      request.setTtl(ttl)
    }

    return request
  }

  /**
   * Creates a new `RemoveRequest`.
   */
  remove (key: K): RemoveRequest {
    const request = new RemoveRequest()
    request.setFormat(this._serializer.format)
    request.setCache(this.cacheName)
    request.setKey(this._serializer.serialize(key))

    return request
  }

  /**
   * Creates a new `RemoveMappingRequest`.
   */
  removeMapping (key: K, value: V): RemoveMappingRequest {
    const request = new RemoveMappingRequest()
    request.setFormat(this._serializer.format)
    request.setCache(this.cacheName)
    request.setKey(this._serializer.serialize(key))
    if (value) {
      request.setValue(this._serializer.serialize(value))
    }

    return request
  }

  /**
   * Creates a new `ReplaceRequest`.
   */
  replace (key: K, value: V): ReplaceRequest {
    const request = new ReplaceRequest()
    request.setFormat(this._serializer.format)
    request.setCache(this.cacheName)
    request.setKey(this._serializer.serialize(key))
    if (value) {
      request.setValue(this._serializer.serialize(value))
    }

    return request
  }

  /**
   * Creates a new `ReplaceMappingRequest`.
   */
  replaceMapping (key: K, value: V, newValue: V): ReplaceMappingRequest {
    const request = new ReplaceMappingRequest()
    request.setFormat(this._serializer.format)
    request.setCache(this.cacheName)
    request.setKey(this._serializer.serialize(key))
    if (value) {
      request.setPreviousvalue(this._serializer.serialize(value))
    }
    if (value) {
      request.setNewvalue(this._serializer.serialize(newValue))
    }

    return request
  }

  /**
   * Creates a new `PageRequest`.
   */
  pageRequest (cookie: Uint8Array | string | undefined): PageRequest {
    const request = new PageRequest()
    request.setCache(this.cacheName)
    request.setFormat(this._serializer.format)
    if (cookie) {
      request.setCookie(cookie)
    }

    return request
  }

  /**
   * Creates a new `MapListenerRequest`.
   */
  mapListenerRequest (isSubscribe: boolean, keyOrFilter: MapEventFilter<K, V> | K | null, isLite?: boolean): MapListenerRequest {
    const request = new MapListenerRequest()
    const filterType = keyOrFilter instanceof MapEventFilter

    request.setUid(this.generateNextRequestId(filterType ? 'filter' : 'key'))
    request.setCache(this.cacheName)
    request.setSubscribe(isSubscribe)
    request.setFormat(this._serializer.format)
    if (isLite) {
      request.setLite(isLite)
    }
    request.setPriming(false)
    if (filterType) {
      request.setType(MapListenerRequest.RequestType.FILTER)
      request.setFilterid(++this.nextFilterId)
      request.setFilter(this._serializer.serialize(keyOrFilter))
    } else {
      request.setType(MapListenerRequest.RequestType.KEY)
      request.setKey(this._serializer.serialize(keyOrFilter))
    }
    request.setTrigger(new Uint8Array())

    return request
  }

  /**
   * Creates a new `MapListenerRequest` for event subscription.
   */
  mapEventSubscribe (): MapListenerRequest {
    const request = new MapListenerRequest()
    request.setCache(this.cacheName)
    request.setUid(this.generateNextRequestId('init'))
    request.setSubscribe(true)
    request.setFormat(this._serializer.format)
    request.setType(MapListenerRequest.RequestType.INIT)

    return request
  }

  /**
   * Creates a new `DestroyRequest`.
   */
  destroy (): DestroyRequest {
    const request = new DestroyRequest()
    request.setCache(this.cacheName)

    return request
  }

  /**
   * Creates a new `ValuesRequest`.
   */
  values (filter?: Filter, comparator?: any): ValuesRequest {
    const request = new ValuesRequest()
    request.setFormat(this._serializer.format)
    request.setCache(this.cacheName)
    if (filter) {
      request.setFilter(this._serializer.serialize(filter))
    }
    if (comparator) {
      request.setComparator(this._serializer.serialize(comparator))
    }

    return request
  }

  /**
   * Utility method for generating a request ID.
   */
  private generateNextRequestId (prefix: string): string {
    return prefix + this.uidPrefix + (++this.nextRequestId)
  }
}
