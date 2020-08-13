/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */


import { BytesValue } from 'google-protobuf/google/protobuf/wrappers_pb'
import { ClientReadableStream } from 'grpc'
import { RequestStateEvent } from '../event/events'
import { NamedCacheClient } from '../named-cache-client'
import { MapEntry } from '../net'
import { EntryResult } from '../net/grpc/messages_pb'
import { Serializer } from './serializer'

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
export class Map<K, V> {

  /**
   * The buckets for storing key/value pairs.
   * The outer array is the bucket location, with the inner array being
   * the bucket for the entries.
   */
  protected readonly buckets: [K, V][][]

  /**
   * The current size of this map.
   */
  protected _size: number = 0

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
   * Returns the size of this map.
   *
   * @return the size of this map
   */
  get size () {
    return this._size
  }

  /**
   * Sets the value for the key in the Map object. Returns the Map object.
   *
   * @param key    the key of the element to add to the Map object
   * @param value  the value of the element to add to the Map object
   *
   * @return this
   */
  set (key: K, value: V): Map<K, V> {
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
   * Calls `callbackFn` once for each key-value pair present in the Map object.
   *
   * @param callbackFn  the Function to execute for each element
   */
  forEach (callbackFn: (value: V, key: K) => void): void {
    const entries = this.entries()
    for (const entry of entries) {
      callbackFn(entry[1], entry[0])
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
   * Returns a new Iterator object that contains an array of [key, value] for each element in the Map object.
   */
  entries (): Iterable<[K, V]> {
    return new EntryIterator(this.buckets)
  }

  /**
   * Returns a new Iterator object that contains the keys for each element in the Map object.
   */
  keys (): Iterable<K> {
    return new KeyIterator(this.buckets)
  }

  /**
   * Returns the value associated to the key, or `undefined` if there is none.
   *
   * @param key  the key of the element to return from the Map object
   */
  get (key: K): V | undefined {
    const bucket = this.buckets[this.getBucket(key)]
    const existing = bucket.find(entry => entry[0] === key)
    return existing ? existing[1] : undefined
  }

  /**
   * Removes all key-value pairs from the Map object.
   */
  clear (): void {
    for (let i = 0, len = this.buckets.length; i < len; i++) {
      this.buckets[i] = []
    }
    this._size = 0
  }

  /**
   * Removes the specified element from a Map object by key.
   *
   * @param key  the key of the element to remove from the Map object
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
   * Returns a new Iterator object that contains an array of [key, value] for each element in the Map object.
   *
   * @return a new Iterator object that contains an array of [key, value] for each element in the Map object
   */
  [Symbol.iterator] (): IterableIterator<[K, V]> {
    return new EntryIterator(this.buckets)
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
   * Helper function to obtain the bucket to store the key/value pair in.
   *
   * @param key  the key to obtain the bucket for
   * @hidden
   */
  private getBucket (key: any) {
    return Math.abs(Map.hash(key.toString()) % this.buckets.length)
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
  private map: Map<T, boolean>

  /**
   * Constructs a new `LocalSet`.
   *
   * @param size
   * @param iterable
   */
  constructor (size: number = 32, iterable?: Iterable<T>) {
    this.map = new Map<T, boolean>(size)
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
 * {@link IterableIterator} implementation for {@link Map} entries.
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
 * {@link IterableIterator} implementation for {@link Map} entries.
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
   * {@link NamedCacheClient} reference to allow manipulate of underlying cache
   * while pages processed.
   */
  protected readonly namedCache: NamedCacheClient<K, V>

  /**
   * Logical identifier for page types.
   */
  [Symbol.toStringTag]: string

  /**
   * Constructs a new `PageSet`.
   *
   * @param namedCache  the {@link NamedCacheClient} to page through
   */
  protected constructor (namedCache: NamedCacheClient<K, V>) {
    this.namedCache = namedCache
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
  get size (): Promise<number> {
    return this.namedCache.size
  }

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
          resolve(v != null || undefined)
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
    return this.namedCache.removeMapping(e.getKey(), e.getValue())
  }

  /**
   * @inheritDoc
   */
  has (value: NamedCacheEntry<K, V>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      return this.namedCache.hasEntry(value.getKey(), value.getValue())
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

      call.on(RequestStateEvent.DATA, function (r: R) {
        if (firstEntry) {
          firstEntry = false
          self.cookie = self.helper.extractCookie(r)
        } else {
          // delete entry.cookie;
          data.push(r)
        }
      })

      call.on(RequestStateEvent.COMPLETE, function () {
        self.exhausted = (self.cookie == null || self.cookie.length == 0)
        resolve(data)
      })

      call.on(RequestStateEvent.ERROR, function (err) {
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
  private key!: K

  /**
   * The deserialized value.
   */
  private value!: V

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
   * @inheritDoc
   */
  getKey (): K {
    if (!this.key) {
      this.key = this.serializer.deserialize(this.keyBytes)
    }
    return this.key
  }

  /**
   * @inheritDoc
   */
  getValue (): V {
    if (!this.value) {
      this.value = this.serializer.deserialize(this.valueBytes)
    }
    return this.value
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