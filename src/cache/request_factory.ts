/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { EntryAggregator } from '../aggregator/aggregator'
import { ValueExtractor } from '../extractor/value_extractor'
import { Filter } from '../filter/filter'
import { MapEventFilter } from '../filter/map_event_filter'
import { EntryProcessor } from '../processor/entry_processor'

import { Serializer } from '../util/serializer'
import { Util } from '../util/util'
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
} from './proto/messages_pb'

export interface Comparator {
  '@class': string;
}

/**
 * A class to facilitate Request objects creation.
 *
 */
export class RequestFactory<K, V> {
  private readonly cacheName: string

  private readonly serializer: Serializer

  // Used for unique uid generation for MapListener subscriptions.
  private readonly uidPrefix: string

  // The next requestID to be used for subscribe requests.
  private nextRequestId: number = 0

  // Thje next filterID to be used for filter subscriptions.
  private nextFilterId: number = 0

  constructor (cacheName: string, serializer: Serializer) {
    if (!cacheName) {
      throw new Error('cache name cannot be null or undefined')
    }
    this.cacheName = cacheName
    this.serializer = serializer
    this.uidPrefix = '-' + cacheName + '-' + Date.now() + '-'
  }

  getSerializer (): Serializer {
    return this.serializer
  }

  // aggregate<R>(keys: Iterable<K>, aggregator: EntryAggregator<K, V, R>): AggregateRequest;
  // aggregate<R>(filter: Filter<V>, aggregator: EntryAggregator<K, V, R>): AggregateRequest;
  // aggregate<R>(aggregator: EntryAggregator<K, V, R>): AggregateRequest;
  aggregate<R> (kfa: Iterable<K> | Filter<V> | EntryAggregator<K, V, R>, aggregator?: EntryAggregator<K, V, R>): AggregateRequest {
    const request = new AggregateRequest()
    request.setCache(this.cacheName)
    request.setFormat(this.serializer.format())
    if (aggregator) {
      // Two args invocation
      request.setAggregator(this.serializer.serialize(aggregator))
      if (kfa instanceof Filter) {
        request.setFilter(this.serializer.serialize(kfa))
      } else {
        for (const key of (kfa as Iterable<K>)) {
          request.addKeys(this.serializer.serialize(key))
        }
      }
    } else {
      // One arg invocation
      request.setAggregator(this.serializer.serialize(kfa))
    }

    return request
  }

  addIndex (extractor: ValueExtractor<any, any>, sorted?: boolean, comparator?: Comparator): AddIndexRequest {
    const request = new AddIndexRequest()

    request.setCache(this.cacheName)
    request.setFormat(this.serializer.format())
    request.setExtractor(this.serializer.serialize(extractor))
    if (sorted) {
      request.setSorted(sorted)
    }
    if (comparator) {
      request.setComparator(this.serializer.serialize(comparator))
    }

    return request
  }

  removeIndex (extractor: ValueExtractor<any, any>): RemoveIndexRequest {
    const request = new RemoveIndexRequest()

    request.setCache(this.cacheName)
    request.setFormat(this.serializer.format())
    request.setExtractor(this.serializer.serialize(extractor))

    return request
  }

  /**
   * Create a ClearRequest instance.
   *
   * @returns A ClearRequest instance.
   */
  clear (): ClearRequest {
    const request = new ClearRequest()
    request.setCache(this.cacheName)

    return request
  }

  /**
   * Create a ContainsEntryRequest instance.
   *
   * @param key   - The key for the request
   * @param value - the value for the request
   *
   * @return A ContainsKey instance.
   */
  containsEntry (key: K, value: V): ContainsEntryRequest {
    const request = new ContainsEntryRequest()
    request.setCache(this.cacheName)
    request.setFormat(this.serializer.format())
    request.setKey(this.serializer.serialize(key))
    if (value) {
      request.setValue(this.serializer.serialize(value))
    }

    return request
  }

  /**
   * Create a ContainsKeyRequest instance.
   *
   * @param key The key for the request.
   *
   * @return A ContainsKey instance.
   */
  containsKey (key: K): ContainsKeyRequest {
    const request = new ContainsKeyRequest()
    request.setFormat(this.serializer.format())
    request.setCache(this.cacheName)
    request.setKey(this.serializer.serialize(key))

    return request
  }

  /**
   * Create a ContainsValueRequest instance.
   *
   * @param value The value for the request.
   *
   * @return A ContainsValueRequest instance.
   */
  containsValue (value: V): ContainsValueRequest {
    const request = new ContainsValueRequest()
    request.setFormat(this.serializer.format())
    request.setCache(this.cacheName)
    if (value) {
      request.setValue(this.serializer.serialize(value))
    }

    return request
  }

  /**
   * Create a GetRequest instance.
   *
   * @param key The key for the request.
   *
   * @return A GetRequest instance.
   */
  get (key: K): GetRequest {
    const request = new GetRequest()
    request.setFormat(this.serializer.format())
    request.setCache(this.cacheName)
    request.setKey(this.serializer.serialize(key))

    return request
  }

  getAll (keys: Iterable<K>): GetAllRequest {
    const request = new GetAllRequest()
    request.setFormat(this.serializer.format())
    request.setCache(this.cacheName)
    for (const key of keys) {
      request.addKey(this.serializer.serialize(key))
    }

    return request
  }

  entrySet (filter?: Filter<any>, comparator?: any): EntrySetRequest {
    const request = new EntrySetRequest()
    request.setFormat(this.serializer.format())
    request.setCache(this.cacheName)
    if (filter) {
      request.setFilter(this.serializer.serialize(filter))
    }
    if (comparator) {
      request.setComparator(this.serializer.serialize(comparator))
    }

    return request
  }

  invoke<R> (key: K, processor: EntryProcessor<K, V, R>): InvokeRequest {
    const request = new InvokeRequest()
    request.setFormat(this.serializer.format())
    request.setCache(this.cacheName)
    request.setKey(this.serializer.serialize(key))
    request.setProcessor(this.serializer.serialize(processor))

    return request
  }

  invokeAll<R> (keysOrFilter: Iterable<K> | Filter<V>, processor?: EntryProcessor<K, V, R>): InvokeAllRequest {
    const request = new InvokeAllRequest()
    request.setFormat(this.serializer.format())
    request.setCache(this.cacheName)
    if (Util.isIterableType(keysOrFilter)) {
      for (const key of keysOrFilter) {
        request.addKeys(this.serializer.serialize(key))
      }
    } else {
      request.setFilter(this.serializer.serialize(keysOrFilter))
    }
    request.setProcessor(this.serializer.serialize(processor))
    return request
  }

  keySet<T> (filter?: Filter<T>): KeySetRequest {
    const request = new KeySetRequest()
    request.setFormat(this.serializer.format())
    request.setCache(this.cacheName)
    if (filter) {
      request.setFilter(this.serializer.serialize(filter))
    }
    return request
  }

  /**
   * Create a PutRequest instance.
   *
   * @param key - The key for the request
   * @param value - The value for the request
   * @param ttl - optional ttl for the entry
   *
   * @return A PutRequest instance.
   */
  put (key: K, value: V, ttl?: number): PutRequest {
    const request = new PutRequest()
    request.setFormat(this.serializer.format())
    request.setCache(this.cacheName)
    request.setKey(this.serializer.serialize(key))
    if (value) {
      request.setValue(this.serializer.serialize(value))
    }
    if (ttl) {
      request.setTtl(ttl)
    }

    return request
  }

  /**
   * Create a PutIfAbsentRequest instance.
   *
   * @param key - the key for the request
   * @param value - the value for the request
   * @param ttl - the time to live for the mapping
   *
   * @return A PutRPutIfAbsentRequest instance.
   */
  putIfAbsent (key: K, value: V, ttl?: number): PutIfAbsentRequest {
    const request = new PutIfAbsentRequest()
    request.setFormat(this.serializer.format())
    request.setCache(this.cacheName)
    request.setKey(this.serializer.serialize(key))
    if (value) {
      request.setValue(this.serializer.serialize(value))
    }
    if (ttl) {
      request.setTtl(ttl)
    }

    return request
  }

  /**
   * Create a RemoveRequest instance.
   *
   * @param key The key for the request.
   *
   * @return A RemoveRequest instance.
   */
  remove (key: K): RemoveRequest {
    const request = new RemoveRequest()
    request.setFormat(this.serializer.format())
    request.setCache(this.cacheName)
    request.setKey(this.serializer.serialize(key))

    return request
  }

  /**
   * Create a RemoveMappingRequest instance.
   *
   * @param key The key for the request.
   * @param value The value for the request.
   *
   * @return A RemoveMappingRequest instance.
   */
  removeMapping (key: K, value: V): RemoveMappingRequest {
    const request = new RemoveMappingRequest()
    request.setFormat(this.serializer.format())
    request.setCache(this.cacheName)
    request.setKey(this.serializer.serialize(key))
    if (value) {
      request.setValue(this.serializer.serialize(value))
    }

    return request
  }

  /**
   * Create a ReplaceRequest instance.
   *
   * @param key - the key for the request
   * @param value - the value for the request
   *
   * @return A ReplaceRequest instance.
   */
  replace (key: K, value: V): ReplaceRequest {
    const request = new ReplaceRequest()
    request.setFormat(this.serializer.format())
    request.setCache(this.cacheName)
    request.setKey(this.serializer.serialize(key))
    if (value) {
      request.setValue(this.serializer.serialize(value))
    }

    return request
  }

  /**
   * Create a ReplaceMappingRequest instance.
   *
   * @param key The key for the request.
   * @param value The value for the request.
   * @param newValue The new value for the request.
   *
   * @return A RemoveMappingRequest instance.
   */
  replaceMapping (key: K, value: V, newValue: V): ReplaceMappingRequest {
    const request = new ReplaceMappingRequest()
    request.setFormat(this.serializer.format())
    request.setCache(this.cacheName)
    request.setKey(this.serializer.serialize(key))
    if (value) {
      request.setPreviousvalue(this.serializer.serialize(value))
    }
    if (value) {
      request.setNewvalue(this.serializer.serialize(newValue))
    }

    return request
  }

  pageRequest (cookie: Uint8Array | string | undefined): PageRequest {
    const request = new PageRequest()
    request.setCache(this.cacheName)
    request.setFormat(this.serializer.format())
    if (cookie) {
      request.setCookie(cookie)
    }

    return request
  }

  mapListenerRequest (isSubscribe: boolean, keyOrFilter: MapEventFilter | K | null, isLite?: boolean): MapListenerRequest {
    const request = new MapListenerRequest()
    const filterType = keyOrFilter instanceof MapEventFilter

    request.setUid(this.generateNextRequestId(filterType ? 'filter' : 'key'))
    request.setCache(this.cacheName)
    request.setSubscribe(isSubscribe)
    request.setFormat(this.serializer.format())
    if (isLite) {
      request.setLite(isLite)
    }
    request.setPriming(false)
    if (filterType) {
      request.setType(MapListenerRequest.RequestType.FILTER)
      request.setFilterid(++this.nextFilterId)
      request.setFilter(this.serializer.serialize(keyOrFilter))
    } else {
      request.setType(MapListenerRequest.RequestType.KEY)
      request.setKey(this.serializer.serialize(keyOrFilter))
    }
    request.setTrigger(new Uint8Array())

    return request
  }

  mapEventSubscribe (): MapListenerRequest {
    const request = new MapListenerRequest()
    request.setCache(this.cacheName)
    request.setUid(this.generateNextRequestId('init'))
    request.setSubscribe(true)
    request.setFormat(this.serializer.format())
    request.setType(MapListenerRequest.RequestType.INIT)

    return request
  }

  destroy (): DestroyRequest {
    const request = new DestroyRequest()
    request.setCache(this.cacheName)

    return request
  }

  values (filter?: Filter, comparator?: any): ValuesRequest {
    const request = new ValuesRequest()
    request.setFormat(this.serializer.format())
    request.setCache(this.cacheName)
    if (filter) {
      request.setFilter(this.serializer.serialize(filter))
    }
    if (comparator) {
      request.setComparator(this.serializer.serialize(comparator))
    }

    return request
  }

  private generateNextRequestId (prefix: string): string {
    return prefix + this.uidPrefix + (++this.nextRequestId)
  }
}
