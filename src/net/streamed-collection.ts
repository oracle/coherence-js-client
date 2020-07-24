/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { RequestStateEvent } from '../event/events'
import { Serializer } from '../util/'
import { BytesValue } from 'google-protobuf/google/protobuf/wrappers_pb'
import { ClientReadableStream } from 'grpc'
import { NamedCacheClient } from '..'
import { MapEntry, RemoteSet } from '.'
import { EntryResult } from './grpc/messages_pb'

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
  clear (): Promise<void> {
    throw new Error('the clear operation is not supported')
  }

  /**
   * @inheritDoc
   */
  abstract delete (value: T): Promise<boolean>;

  /**
   * @inheritDoc
   */
  abstract has (value: T): Promise<boolean>;

  /**
   * @inheritDoc
   */
  size (): Promise<number> {
    return this.namedCache.size()
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
      return this.namedCache.remove(key)
        .then((v) => {
          resolve(v != null || undefined)
        })
    })
  }

  /**
   * @inheritDoc
   */
  has (key: K): Promise<boolean> {
    return this.namedCache.containsKey(key)
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
      return this.namedCache.containsEntry(value.getKey(), value.getValue())
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
   * Constructs a new `ValueSet`.
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
      return this.namedCache.containsValue(value)
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
    return new NamedCacheEntry(e.getKey_asU8(), e.getValue_asU8(), this.namedCache.getRequestFactory().getSerializer())
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
    return this.namedCache.getRequestFactory().getSerializer().deserialize(e.getValue_asU8())
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
    return this.namedCache.getRequestFactory().getSerializer().deserialize(e.getValue_asU8())
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
