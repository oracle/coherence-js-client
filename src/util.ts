/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ClientReadableStream } from '@grpc/grpc-js'
import { BytesValue } from 'google-protobuf/google/protobuf/wrappers_pb'
import { aggregator } from './aggregators'
import { event } from './events'
import { extractor } from './extractors'
import { filter } from './filters'
import {
  AddIndexRequest,
  AggregateRequest,
  ClearRequest,
  ContainsEntryRequest,
  ContainsKeyRequest,
  ContainsValueRequest,
  DestroyRequest, Entry,
  EntryResult,
  EntrySetRequest,
  GetAllRequest,
  GetRequest,
  InvokeAllRequest,
  InvokeRequest,
  KeySetRequest,
  MapListenerRequest,
  PageRequest, PutAllRequest,
  PutIfAbsentRequest,
  PutRequest,
  RemoveIndexRequest,
  RemoveMappingRequest,
  RemoveRequest,
  ReplaceMappingRequest,
  ReplaceRequest,
  ValuesRequest
} from './grpc/messages_pb'
import { MapEntry, NamedCacheClient } from './named-cache-client'
import { processor } from './processors'

export namespace util {

  /**
   * A drop-in replacement for the default ECMA Map implementation that uses
   * hashes keys based on the string view of an Object.
   *
   * Unlike the default ECMA Map implementation, this version does not maintain
   * insertion order and does not make any guarantees on iteration order nor does
   * enforce key identity equivalency when attempting to look up a mapping.  This allows
   * this implementation to store and compare objects that are equal, but not necessarily
   * the same instance.
   *
   * The hashing algorithm is based on that of Java's HashMap.
   *
   * @typeParam K  the type of the key
   * @typeParam V  the type of the value
   */
  export class HashMap<K, V> implements Map<K, V> {

    /**
     * @inheritDoc
     */
    readonly [Symbol.toStringTag]: string = 'HashMap'

    /**
     * The buckets for storing key/value pairs.
     * The outer array is the bucket location, with the inner array being
     * the bucket for the entries.
     */
    protected readonly buckets: [K, V][][]

    /**
     * Constructs a new Map.
     *
     * @param size      the number of buckets to spread entries across
     * @param iterable  initial entries to add to the map.
     */
    constructor (size: number = 32, iterable?: Iterable<[K, V]>) {
      this.buckets = []
      for (let i = 0; i < size; i++) {
        this.buckets.push([])
      }
      if (iterable) {
        for (const element of iterable) {
          this.set(element[0], element[1])
        }
      }
    }

    /**
     * The current size of this map.
     */
    protected _size: number = 0

    /**
     * @inheritDoc
     */
    get size () {
      return this._size
    }

    /**
     * Hashing function.
     *
     * @param str the string to hash
     * @hidden
     */
    private static hash (str: string): number {
      let hash = 0
      if (str.length == 0) return hash
      for (let i = 0; i < str.length; i++) {
        let char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32bit integer
      }
      return hash
    }

    /**
     * @inheritDoc
     */
    set (key: K, value: V): this {
      const bucket = this.buckets[this.getBucket(key)]
      const existing = bucket.find(entry => entry[0] === key)
      if (existing) {
        existing[1] = value
      } else {
        bucket.push([key, value])
        this._size++
      }
      return this
    }

    /**
     * @inheritDoc
     */
    forEach (callbackFn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void {
      const entries = this.entries()
      if (thisArg) {
        callbackFn.bind(thisArg)
      }
      for (const entry of entries) {
        callbackFn(entry[1], entry[0], this)
      }
    }

    /**
     * Returns a boolean asserting whether a value has been associated to the key in the Map object or not.
     *
     * @param key  the key of the element to test for presence in the Map object
     *
     * @return `true` if the key is currently associated with a value within the map, otherwise returns `false`
     */
    has (key: K): boolean {
      const bucket = this.buckets[this.getBucket(key)]
      return bucket.find(entry => entry[0] === key) !== undefined
    }

    /**
     * @inheritDoc
     */
    entries (): IterableIterator<[K, V]> {
      return new EntryIterator(this.buckets)
    }

    values (): IterableIterator<V> {
      return new ValueIterator(this.buckets)
    }



    /**
     * @inheritDoc
     */
    keys (): IterableIterator<K> {
      return new KeyIterator(this.buckets)
    }

    /**
     * @inheritDoc
     */
    get (key: K): V | undefined {
      const bucket = this.buckets[this.getBucket(key)]
      const existing = bucket.find(entry => entry[0] === key)
      return existing ? existing[1] : undefined
    }

    /**
     * @inheritDoc
     */
    clear (): void {
      for (let i = 0, len = this.buckets.length; i < len; i++) {
        this.buckets[i] = []
      }
      this._size = 0
    }

    /**
     * @inheritDoc
     */
    delete (key: K): boolean {
      const bucket = this.buckets[this.getBucket(key)]
      const existing = bucket.find(entry => entry[0] === key)
      if (existing) {
        bucket.splice(bucket.indexOf(existing), 1)
        this._size--
        return true
      }
      return existing !== undefined
    }

    /**
     * @inheritDoc
     */
    [Symbol.iterator] (): IterableIterator<[K, V]> {
      return new EntryIterator(this.buckets)
    }

    /**
     * Helper function to obtain the bucket to store the key/value pair in.
     *
     * @param key  the key to obtain the bucket for
     * @hidden
     */
    private getBucket (key: any) {
      return Math.abs(HashMap.hash(key.toString()) % this.buckets.length)
    }
  }

  /**
   * This is a local implementation of {@link RemoteSet} for cases when entries are cannot
   * be scrolled through on the server and must instead be cached on the client.
   */
  export class LocalSet<T> implements RemoteSet<T> {

    /**
     * Element storage.
     */
    private map: HashMap<T, boolean>

    /**
     * Constructs a new `LocalSet`.
     *
     * @param size
     * @param iterable
     */
    constructor (size: number = 32, iterable?: Iterable<T>) {
      this.map = new HashMap<T, boolean>(size)
      if (iterable) {
        for (const element of iterable) {
          this.map.set(element, true)
        }
      }
    }

    /**
     * @inheritDoc
     */
    get size () {
      return Promise.resolve(this.map.size)
    }

    /**
     * @inheritDoc
     */
    clear (): Promise<boolean> {
      return Promise.resolve(false)
    }

    /**
     * Adds value to the Set object. Returns the Set object.
     *
     * @param val  the value of the element to add to the Set object
     *
     * @return this
     * @hidden
     */
    add (val: T): LocalSet<T> {
      this.map.set(val, true)
      return this
    }

    /**
     * @inheritDoc
     */
    delete (val: T): Promise<boolean> {
      return Promise.resolve(false)
    }

    /**
     * @inheritDoc
     */
    has (val: T): Promise<boolean> {
      return Promise.resolve(this.map.has(val))
    }

    /**
     * @inheritDoc
     */
    [Symbol.iterator] (): IterableIterator<T> {
      // @ts-ignore
      return new KeyIterator(this.map.buckets)
    }

    /**
     * @inheritDoc
     */
    [Symbol.asyncIterator] (): IterableIterator<T> {
      // @ts-ignore  --  bypass protection to access map buckets
      return new KeyIterator(this.map.buckets)
    }
  }

  /**
   * {@link IterableIterator} implementation for {@link HashMap} entries.
   */
  class EntryIterator<K, V> implements IterableIterator<[K, V]> {

    /**
     * The buckets from the map this iterator will be processing.
     */
    protected readonly buckets: [K, V][][]

    /**
     * The current bucket index.
     */
    protected bucketsIdx: number = 0

    /**
     * The current index within the bucket.
     */
    protected bucketContentsIdx: number = 0

    /**
     * Constructs a new `EntryIterator`.
     *
     * @param buckets  the buckets to iterator over
     */
    constructor (buckets: [K, V][][]) {
      this.buckets = buckets
    }

    /**
     * @inheritDoc
     */
    next (...args: [] | [undefined]): IteratorResult<[K, V]> {
      const bc = this.buckets.length
      while (this.bucketsIdx < bc) {
        const bucket = this.buckets[this.bucketsIdx]
        if (this.bucketContentsIdx < bucket.length) {
          return this.result(bucket[this.bucketContentsIdx++])
        } else {
          this.bucketContentsIdx = 0
          this.bucketsIdx++
        }
      }
      return {done: true, value: null}
    }

    /**
     * @inheritDoc
     */
    [Symbol.iterator] (): IterableIterator<[K, V]> {
      return this
    }

    /**
     * Return the iteration result appropriate to this iterator type.
     *
     * @param entry  the map entry
     */
    protected result (entry: [K, V]): IteratorResult<any> {
      return {done: false, value: entry}
    }
  }

  /**
   * {@link IterableIterator} implementation for {@link HashMap} keys.
   */
  class KeyIterator<K> implements IterableIterator<K> {

    /**
     * The wrapped {@link EntryIterator}.
     */
    protected readonly entryIterator: EntryIterator<K, any>

    /**
     * Constructs a new `EntryIterator`.
     *
     * @param buckets  the buckets to iterator over
     */
    constructor (buckets: [K, any][][]) {
      this.entryIterator = new EntryIterator<K, any>(buckets)
    }

    /**
     * @inheritDoc
     */
    next (...args: [] | [undefined]): IteratorResult<K> {
      const result = this.entryIterator.next()
      if (result.value) {
        result.value = result.value[0]
      }
      return result as IteratorResult<K>
    }

    /**
     * @inheritDoc
     */
    [Symbol.iterator] (): IterableIterator<K> {
      return this
    }
  }

  /**
   * {@link IterableIterator} implementation for {@link HashMap} values.
   */
  class ValueIterator<V> implements IterableIterator<V> {

    /**
     * The wrapped {@link EntryIterator}.
     */
    protected readonly entryIterator: EntryIterator<any, V>

    /**
     * Constructs a new `EntryIterator`.
     *
     * @param buckets  the buckets to iterator over
     */
    constructor (buckets: [any, V][][]) {
      this.entryIterator = new EntryIterator<any, V>(buckets)
    }

    /**
     * @inheritDoc
     */
    next (...args: [] | [undefined]): IteratorResult<V> {
      const result = this.entryIterator.next()
      if (result.value) {
        result.value = result.value[1]
      }
      return result as IteratorResult<V>
    }

    /**
     * @inheritDoc
     */
    [Symbol.iterator] (): IterableIterator<V> {
      return this
    }
  }

  /**
   * A `RemoteSet` is similar to the standard Javascript set, however, operations against it
   * *may* result in a network operation.  Also note, that no mutation is allowed aside from clearing all or removing
   * elements, though even in these cases removal may not be guaranteed; be sure to check the return value from the
   * `clear` and `delete` function to verify if deletion actually occurred.
   */
  export interface RemoteSet<T> {

    /**
     * Returns the number of values in the Set object.
     *
     * @return the number of values in the Set object
     */
    readonly size: Promise<number>

    /**
     * Removes all elements from the Set object.
     *
     * @returns a `Promise` resolving to `true` if the elements were removed from this set, otherwise resolves to `false`
     */
    clear (): Promise<boolean>

    /**
     * Removes the specified element from this set if it is present.
     *
     * @param value  the value to be removed from this set, if present
     *
     * @return a `Promise` resolving to `true` if the elements were removed from this set, otherwise resolves to `false`
     */
    delete (value: T): Promise<boolean>

    /**
     * Returns `true` if this set contains the specified element.
     *
     * @param value  whose presence in this set is to be tested
     *
     * @return a `Promise` resolving to `true` if set contains the value, or `false` if not
     */
    has (value: T): Promise<boolean>

    /**
     * The iterator over this set.
     *
     * @return a iterator over this set
     */
    [Symbol.iterator] (): IterableIterator<T>
  }

  /**
   * A PagedSet provides the ability to page through the contents of a
   * cache a `page` at a time vs obtaining the entire result set.
   *
   * @typeParam K  the key type
   * @typeParam V  the value type
   * @typeParam T  depending on the implementation, `T` may be equivalent to `K`, `V`, or `MapEntry<K, V>`
   */
  abstract class PagedSet<K, V, T>
    implements RemoteSet<T> {
    /**
     * Logical identifier for page types.
     */
    [Symbol.toStringTag]: string | undefined
    /**
     * {@link NamedCacheClient} reference to allow manipulate of underlying cache
     * while pages processed.
     */
    protected readonly namedCache: NamedCacheClient<K, V>

    /**
     * Constructs a new `PageSet`.
     *
     * @param namedCache  the {@link NamedCacheClient} to page through
     */
    protected constructor (namedCache: NamedCacheClient<K, V>) {
      this.namedCache = namedCache
    }

    /**
     * @inheritDoc
     */
    get size (): Promise<number> {
      return this.namedCache.size
    }

    /**
     * This is an unsupported operation.
     */
    clear (): Promise<boolean> {
      throw new Error('the clear operation is not supported')
    }

    /**
     * @inheritDoc
     */
    abstract delete (value: T): Promise<boolean>

    /**
     * @inheritDoc
     */
    abstract has (value: T): Promise<boolean>

    /**
     * @inheritDoc
     */
    [Symbol.iterator] (): IterableIterator<T> {
      throw new Error('only async iterator supported.')
    }
  }

  /**
   * A pageable collection of keys based on the provided `NamedCache<K, V>`.
   *
   * @typeParam K the key type of the named cache
   * @typeParam V the value type of the named cache
   * @internal
   */
  export class KeySet<K, V>
    extends PagedSet<K, V, K> {
    [Symbol.toStringTag]: string = 'KeySet'

    /**
     * Constructs a new `KeySet`.
     *
     * @param namedCache  the {@link NamedCacheClient} to page through
     */
    constructor (namedCache: NamedCacheClient<K, V>) {
      super(namedCache)
    }

    /**
     * @inheritDoc
     */
    delete (key: K): Promise<boolean> {
      return new Promise((resolve) => {
        return this.namedCache.delete(key)
          .then((v) => {
            resolve(v != null || false)
          })
      })
    }

    /**
     * @inheritDoc
     */
    has (key: K): Promise<boolean> {
      return this.namedCache.has(key)
    }

    /**
     * Returns an async iterator for paging.
     *
     * @return an async iterator for paging
     */
    [Symbol.asyncIterator] () {
      return new PageAdvancer(new KeySetHelper(this.namedCache))
    }
  }

  /**
   * A pageable collection of {@link MapEntry}s based on the provided `NamedCache<K, V>`.
   *
   * @typeParam K  the key type of the named cache
   * @typeParam V  the value type of the named cache
   * @internal
   */
  export class EntrySet<K, V>
    extends PagedSet<K, V, MapEntry<K, V>> {
    [Symbol.toStringTag]: string = 'EntrySet'

    /**
     * Constructs a new `EntrySet`.
     *
     * @param namedCache  the {@link NamedCacheClient} to page through
     */
    constructor (namedCache: NamedCacheClient<K, V>) {
      super(namedCache)
    }

    /**
     * @inheritDoc
     */
    delete (e: MapEntry<K, V>): Promise<boolean> {
      return this.namedCache.removeMapping(e.key, e.value)
    }

    /**
     * @inheritDoc
     */
    has (value: MapEntry<K, V>): Promise<boolean> {
      return new Promise((resolve, reject) => {
        return this.namedCache.hasEntry(value.key, value.value)
          .then((v) => {
            resolve(v)
          }).catch(e => reject(e))
      })
    }

    /**
     * Returns an async iterator for paging.
     *
     * @return an async iterator for paging
     */
    [Symbol.asyncIterator] () {
      return new PageAdvancer(new EntrySetHelper(this.namedCache))
    }
  }

  /**
   * A pageable collection of values based on the provided `NamedCache<K, V>`.
   *
   * @typeParam K  the key type of the named cache
   * @typeParam V  the value type of the named cache
   * @internal
   */
  export class ValueSet<K, V>
    extends PagedSet<K, V, V> {
    [Symbol.toStringTag]: string = 'ValueSet'

    /**
     * Constructs  a new `ValueSet`.
     *
     * @param namedCache  the {@link NamedCacheClient} to page through
     */
    constructor (namedCache: NamedCacheClient<K, V>) {
      super(namedCache)
    }

    /**
     * This is an unsupported operation.
     */
    delete (e: V): Promise<boolean> {
      throw new Error('delete not allowed on paged value set.')
    }

    /**
     * @inheritDoc
     */
    has (value: V): Promise<boolean> {
      return new Promise((resolve, reject) => {
        return this.namedCache.hasValue(value)
          .then((v) => {
            resolve(v)
          }).catch(e => reject(e))
      })
    }

    /**
     * Returns an async iterator for paging.
     *
     * @return an async iterator for paging
     */
    [Symbol.asyncIterator] () {
      return new PageAdvancer(new ValueSetHelper(this.namedCache))
    }
  }

  /**
   * Helper for streaming cache entries.
   */
  class EntrySetHelper<K, V>
    implements IStreamedDataHelper<EntryResult, MapEntry<K, V>> {
    private namedCache: NamedCacheClient<K, V>

    /**
     * Constructs a new EntrySetHelper.
     *
     * @param namedCache  the backing {@link NamedCacheClient}
     */
    constructor (namedCache: NamedCacheClient<K, V>) {
      this.namedCache = namedCache
    }

    /**
     * @inheritDoc
     */
    extractCookie (e: EntryResult): Cookie {
      return e.getCookie()
    }

    /**
     * @inheritDoc
     */
    handleEntry (e: EntryResult): MapEntry<K, V> {
      return new NamedCacheEntry(e.getKey_asU8(), e.getValue_asU8(), this.namedCache.getRequestFactory().serializer)
    }

    /**
     * @inheritDoc
     */
    loadNextPage (cookie: Cookie): ClientReadableStream<EntryResult> {
      return this.namedCache.nextEntrySetPage(cookie)
    }
  }

  /**
   * Helper for streaming cache values.
   */
  class ValueSetHelper<K, V>
    implements IStreamedDataHelper<EntryResult, V> {
    private namedCache: NamedCacheClient<K, V>

    /**
     * Constructs a new ValueSetHelper.
     *
     * @param namedCache  the backing {@link NamedCacheClient}
     */
    constructor (namedCache: NamedCacheClient<K, V>) {
      this.namedCache = namedCache
    }

    /**
     * @inheritDoc
     */
    extractCookie (e: EntryResult): Cookie {
      return e.getCookie()
    }

    /**
     * @inheritDoc
     */
    handleEntry (e: EntryResult): V {
      return this.namedCache.getRequestFactory().serializer.deserialize(e.getValue_asU8())
    }

    /**
     * @inheritDoc
     */
    loadNextPage (cookie: Cookie): ClientReadableStream<EntryResult> {
      return this.namedCache.nextEntrySetPage(cookie)
    }
  }

  /**
   * Helper for streaming cache keys.
   */
  class KeySetHelper<K, V>
    implements IStreamedDataHelper<BytesValue, K> {
    private namedCache: NamedCacheClient<K, V>

    /**
     * Constructs a new KeySetHelper.
     *
     * @param namedCache  the backing {@link NamedCacheClient}
     */
    constructor (namedCache: NamedCacheClient<K, V>) {
      this.namedCache = namedCache
    }

    /**
     * @inheritDoc
     */
    extractCookie (e: BytesValue): Cookie {
      return e.getValue()
    }

    /**
     * @inheritDoc
     */
    handleEntry (e: BytesValue): K {
      return this.namedCache.getRequestFactory().serializer.deserialize(e.getValue_asU8())
    }

    /**
     * @inheritDoc
     */
    loadNextPage (cookie: Cookie): ClientReadableStream<EntryResult> {
      // @ts-ignore
      return this.namedCache.nextKeySetPage(cookie)
    }
  }

  /**
   * PageAdvancer is responsible for loading pages of entries on demand.
   *
   * @typeParam K  the cache key type
   * @typeParam V  the cache value type
   * @typeParam R  the raw key/value type
   * @typeParam T  the type after R has been deserialized
   */
  class PageAdvancer<K, V, R, T> {

    /**
     * Flag indicating all entries have been processed.
     */
    private exhausted: boolean

    /**
     * Raw entries from the proxy.
     */
    private data: R[]

    /**
     * Opaque cookie for page boundaries.
     */
    private cookie: Cookie

    /**
     * Helper responsible for loading data.
     */
    private helper: IStreamedDataHelper<R, T>

    /**
     * Constructs a new `PageAdvancer`.
     *
     * @param helper  the {@link IStreamedDataHelper} responsible for loading data from the cache
     */
    constructor (helper: IStreamedDataHelper<R, T>) {
      this.exhausted = false
      this.helper = helper
      this.data = []
    }

    /**
     * Return the next entry in the page, loading additional entries as needed.
     *
     * @return a `Promise` returning an object with a `value` field containing the cache value.
     *         The return value may also include a flag, `done`, which signals no further entries to process
     */
    async next (): Promise<{ done?: boolean, value?: T }> {
      const self = this
      if (self.data.length == 0) {
        if (!self.exhausted) {
          self.data = await self.loadNextPage()
          return self.next()
        } else {
          return Promise.resolve({done: true})
        }
      } else {
        return Promise.resolve({value: self.helper.handleEntry(self.data.shift())})
      }
    }

    /**
     * Loads the next page of data.
     *
     * @return the next page of entries from the cache
     */
    private loadNextPage (): Promise<R[]> {
      const self = this

      let firstEntry = true
      const data: R[] = []

      return new Promise((resolve, reject) => {
        const call = self.helper.loadNextPage(self.cookie)

        call.on(event.RequestStateEvent.DATA, function (r: R) {
          if (firstEntry) {
            firstEntry = false
            self.cookie = self.helper.extractCookie(r)
          } else {
            // delete entry.cookie;
            data.push(r)
          }
        })

        call.on(event.RequestStateEvent.COMPLETE, function () {
          self.exhausted = (self.cookie == null || self.cookie.length == 0)
          resolve(data)
        })

        call.on(event.RequestStateEvent.ERROR, function (err) {
          console.log('Error: ' + err)
          reject(err)
        })
      })
    }
  }

  /**
   * Streaming data helper; allows loading of cache entries in pages.
   */
  interface IStreamedDataHelper<R, T> {

    /**
     * Extract the cookie, if any, from the provided raw value.
     *
     * @param raw  the raw value from which to extract the cookie from
     *
     * @return the extracted cookie, if any
     */
    extractCookie (raw: R): Cookie;

    /**
     * Performs the steps necessary to provide a readable value from the raw bytes.
     *
     * @param raw  the raw bytes of the value
     *
     * @return the re-constructed value from the raw bytes
     */
    handleEntry (raw: R | undefined): T;

    /**
     * Loads the next page of cache entries.
     *
     * @param req
     *
     * @return a {@link ClientReadableStream} to stream the next page of cache entries
     */
    loadNextPage (req: Cookie): ClientReadableStream<R>;
  }

  /**
   * A specialized {@link MapEntry} implementation that will lazily deserialize
   * keys/values upon request.
   * @internal
   */
  export class NamedCacheEntry<K, V>
    implements MapEntry<K, V> {

    /**
     * The deserialized key.
     */
    private _key!: K

    /**
     * @inheritDoc
     */
    get key (): K {
      if (!this._key) {
        this._key = this.serializer.deserialize(this.keyBytes)
      }
      return this._key
    }

    /**
     * The raw key bytes.
     */
    private readonly keyBytes: Uint8Array

    /**
     * The raw value bytes.
     * @private
     */
    private readonly valueBytes: Uint8Array

    /**
     * The {@link Serializer} to use to deserialize the raw keys and values.
     * @private
     */
    private serializer: Serializer

    /**
     * Constructs a new `NamedCacheEntry`.
     *
     * @param keyBytes    the raw key bytes
     * @param valueBytes  the raw value bytes
     * @param serializer  the `Serializer` to use to deserialize the raw keys and values
     */
    constructor (keyBytes: Uint8Array, valueBytes: Uint8Array, serializer: Serializer) {
      this.keyBytes = keyBytes
      this.valueBytes = valueBytes
      this.serializer = serializer
    }

    /**
     * The deserialized value.
     */
    private _value!: V

    /**
     * @inheritDoc
     */
    get value (): V {
      if (!this._value) {
        this._value = this.serializer.deserialize(this.valueBytes)
      }
      return this._value
    }
  }

  /**
   * Type alias for page cookies.
   * @internal
   */
  type Cookie = Uint8Array | string | undefined;

  export interface Comparator {
    '@class': string;
  }

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
     * The cache this `RequestFactory` will be making requests for.
     */
    protected readonly scope: string

    /**
     * Unique uid generation for event callback subscriptions.
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
     * The payload serializer.
     */
    private readonly _serializer: Serializer

    /**
     * Constructs a new `RequestFactory`.
     *
     * @param cacheName   the cache name
     * @param scope       the cache scope
     * @param serializer  the payload serializer
     */
    constructor (cacheName: string, scope: string, serializer: Serializer) {
      if (!cacheName) {
        throw new Error('cache name cannot be null or undefined')
      }
      this.cacheName = cacheName
      this._serializer = serializer
      this.scope = scope
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
    aggregate<R = any> (kfa: Iterable<K> | filter.Filter | aggregator.EntryAggregator<K, V, R>, aggregator?: aggregator.EntryAggregator<K, V, R>): AggregateRequest {
      const request = new AggregateRequest()
      this.initRequest(request)
      if (aggregator) {
        // Two args invocation
        request.setAggregator(this._serializer.serialize(aggregator))
        if (kfa instanceof filter.Filter) {
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
    addIndex (extractor: extractor.ValueExtractor, sorted?: boolean, comparator?: Comparator): AddIndexRequest {
      const request = new AddIndexRequest()

      this.initRequest(request)
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
    removeIndex (extractor: extractor.ValueExtractor): RemoveIndexRequest {
      const request = new RemoveIndexRequest()

      this.initRequest(request)
      request.setExtractor(this._serializer.serialize(extractor))

      return request
    }

    /**
     * Create a new `ClearRequest`.
     */
    clear (): ClearRequest {
      const request = new ClearRequest()
      this.initRequest(request)

      return request
    }

    /**
     * Creates a new `ContainsEntryRequest`.
     */
    containsEntry (key: K, value: V): ContainsEntryRequest {
      const request = new ContainsEntryRequest()
      this.initRequest(request)
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
      this.initRequest(request)
      request.setKey(this._serializer.serialize(key))

      return request
    }

    /**
     * Create a new `ContainsValueRequest`.
     */
    containsValue (value: V): ContainsValueRequest {
      const request = new ContainsValueRequest()
      this.initRequest(request)
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
      this.initRequest(request)
      request.setKey(this._serializer.serialize(key))

      return request
    }

    /**
     * Create a new `GetAllRequest`.
     */
    getAll (keys: Iterable<K>): GetAllRequest {
      const request = new GetAllRequest()
      this.initRequest(request)
      for (const key of keys) {
        request.addKey(this._serializer.serialize(key))
      }

      return request
    }

    /**
     * Creates a new `EntrySetRequest`.
     */
    entrySet (filter?: filter.Filter, comparator?: any): EntrySetRequest {
      const request = new EntrySetRequest()
      this.initRequest(request)
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
    invoke<R> (key: K, processor: processor.EntryProcessor<K, V, R>): InvokeRequest {
      const request = new InvokeRequest()
      this.initRequest(request)
      request.setKey(this._serializer.serialize(key))
      request.setProcessor(this._serializer.serialize(processor))

      return request
    }

    /**
     * Creates a new `InvokeAllRequest`.
     */
    invokeAll<R = any> (keysOrFilter: Iterable<K> | filter.Filter, processor?: processor.EntryProcessor<K, V, R>): InvokeAllRequest {
      const request = new InvokeAllRequest()
      this.initRequest(request)
      if (isIterableType(keysOrFilter)) {
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
    keySet<T> (filter?: filter.Filter): KeySetRequest {
      const request = new KeySetRequest()
      this.initRequest(request)
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
      this.initRequest(request)
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
     * Creates a new `PutAllRequest`.
     *
     * @param map the entries to insert
     */
    putAll(map: Map<K, V>): PutAllRequest {
      const request = new PutAllRequest()
      this.initRequest(request)
      map.forEach((value, key) => {
        const e = new Entry();
        e.setKey(this._serializer.serialize(key))
        if (value) {
          e.setValue(this._serializer.serialize(value))
        }
        request.addEntry(e)
      })

      return request
    }

    /**
     * Creates a new `PageRequest`.
     */
    page (cookie: Uint8Array | string): PageRequest {
      const request = new PageRequest()
      this.initRequest(request)
      request.setCookie(cookie)

      return request
    }

    /**
     * Creates a new `PutIfAbsentRequest`.
     */
    putIfAbsent (key: K, value: V, ttl?: number): PutIfAbsentRequest {
      const request = new PutIfAbsentRequest()
      this.initRequest(request)
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
      this.initRequest(request)
      request.setKey(this._serializer.serialize(key))

      return request
    }

    /**
     * Creates a new `RemoveMappingRequest`.
     */
    removeMapping (key: K, value: V): RemoveMappingRequest {
      const request = new RemoveMappingRequest()
      this.initRequest(request)
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
      this.initRequest(request)
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
      this.initRequest(request)
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
      this.initRequest(request)
      if (cookie) {
        request.setCookie(cookie)
      }

      return request
    }

    /**
     * Creates a new `MapListenerRequest`.
     */
    mapListenerRequest (isSubscribe: boolean, keyOrFilter: filter.MapEventFilter<K, V> | K | null, isLite?: boolean): MapListenerRequest {
      const request = new MapListenerRequest()
      const filterType = keyOrFilter instanceof filter.MapEventFilter

      this.initRequest(request)
      request.setUid(this.generateNextRequestId(filterType ? 'filter' : 'key'))
      request.setSubscribe(isSubscribe)
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
      this.initRequest(request)
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
      this.initRequest(request)

      return request
    }

    /**
     * Creates a new `ValuesRequest`.
     */
    values (filter?: filter.Filter, comparator?: any): ValuesRequest {
      const request = new ValuesRequest()
      this.initRequest(request)
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

    /**
     * Set initial properties common to all requests.
     */
    private initRequest (request: object) {
      // @ts-ignore
      request.setCache(this.cacheName)
      // @ts-ignore
      request.setScope(this.scope)
      // @ts-ignore
      if (typeof request.setFormat === 'function') {
        // @ts-ignore
        request.setFormat(this._serializer.format)
      }
    }
  }

  /**
   * The `Serializer` interfaces defines the set of methods for serializing
   * and deserializing objects.
   */
  export interface Serializer {

    /**
     * The serializer format.
     */
    readonly format: string;

    /**
     * Serializes the specified object and returns the
     * {@link Buffer} containing the serialized data.
     *
     * @param obj  the object to be serialized
     *
     * @returns the {@link Buffer} containing the serialized data.
     */
    serialize (obj: any): Buffer;

    /**
     * Deserializes and returns a new Javascript object.
     *
     * @param value The object to be deserialized.
     *
     * @returns The deserialized object.
     */
    deserialize (value: any): any;

  }

  /**
   * A Serializer implementation supporting `JSON` as payload format.
   */
  class JSONSerializer
    implements Serializer {
    protected static JSON_SERIALIZER_PREFIX: number = 21
    private readonly _format: string = 'json'

    /**
     * @inheritDoc
     */
    get format (): string {
      return this._format
    }

    /**
     * @inheritDoc
     */
    public serialize (obj: any): Buffer {
      const headerBuf = Buffer.alloc(1);
      headerBuf.writeInt8(JSONSerializer.JSON_SERIALIZER_PREFIX)
      const valBuf = Buffer.from(JSON.stringify(obj));

      return Buffer.concat([headerBuf, valBuf], headerBuf.length + valBuf.length);
    }

    /**
     * @inheritDoc
     */
    public deserialize (value: any): any {
      if (value && value.length > 0) {
        let buf = Buffer.from(value)
        if (buf.length > 0) {
          if (buf.readInt8(0) == JSONSerializer.JSON_SERIALIZER_PREFIX) {
            buf = buf.slice(1)
          }
          return JSON.parse(buf.toString())
        }
      }
      return null
    }
  }

  /**
   * A singleton object that holds the collection of
   * available {@link Serializer}s.
   * @hidden
   */
  export class SerializerRegistry {
    static readonly singleton = new SerializerRegistry()

    /**
     * Mapping between ID and Serializer implementation.
     */
    protected serializers = new Map<string, Serializer>()

    private constructor () {
      const jsonSerializer = new JSONSerializer()
      this.serializers.set(jsonSerializer.format, jsonSerializer)
    }

    /**
     * A factory method for obtaining the singleton instance.
     *
     * @returns The singleton SerializerRegistry instance.
     */
    public static instance (): SerializerRegistry {
      return SerializerRegistry.singleton
    }

    /**
     * Returns the Serializer for the specified format.
     *
     * @param format  the required serialization format.
     *
     * @returns The Serializer that is capable of Serializing
     *          objects in the specified format.
     */
    public serializer (format: string): Serializer {
      const serializer = SerializerRegistry.instance().serializers.get(format)
      if (!serializer) {
        throw new Error('No serializer registered for format: ' + format)
      }

      return serializer
    }
  }


  /**
   * Ensure the property is not `null` or `undefined` and if so, will throw a new
   * {@link Error} with the provided message as the cause.
   *
   * @param property  the property to test
   * @param message   the message to use when throwing an error
   * @ignore
   */
  export function ensureNotNull (property: any | undefined | null, message: string) {
    if (!property) {
      throw new Error(message)
    }
  }

  /**
   * Ensure the property is not a zero-length string and if so, will throw a new
   * {@link Error} with the provided message as the cause.
   *
   * @param property  the property to test
   * @param message   the message to use when throwing an error
   * @ignore
   */
  export function ensureNonEmptyString (property: string | null | undefined, message: string) {
    if (!property || property.trim().length == 0) {
      throw new Error(message)
    }
  }

  /**
   * Ensure the provided array is not empty and if it is, throw a new {@link Error} with the provided
   * message as the cause.
   *
   * @param arr      the array to test
   * @param message  the message to use when throwing an error.
   * @ignore
   */
  export function ensureNotEmpty (arr: any[] | undefined | null, message: string) {
    if (arr == null || arr.length == 0) {
      throw new Error(message)
    }
  }

  /**
   * Utility function for checking if an object is an Iterable.
   *
   * @param arg  the object to test
   * @ignore
   */
  export function isIterableType<T> (arg: any): arg is Iterable<T> {
    return arg && typeof arg[Symbol.iterator] === 'function'
  }

}