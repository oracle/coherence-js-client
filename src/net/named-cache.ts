/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { EntryAggregator } from '../aggregator'
import { CacheLifecycleEvent, MapListener } from '../event'
import { ValueExtractor } from '../extractor'
import { ContainsAnyFilter, Filter, MapEventFilter } from '../filter'
import { EntryProcessor } from '../processor'
import { Comparator } from '../util/'

/**
 *  A Map-based data-structure that representing a NamedCache hosted within a Coherence grid.
 */
export interface NamedCache<K, V> {

  /**
   * Clears all the mappings in the cache.
   *
   * @return a `Promise` eventually returning `null`
   */
  clear (): Promise<void>;

  /**
   * Returns `true` if the specified key is mapped a value within the cache.
   *
   * @param key  the key whose presence in this cache is to be tested
   *
   * @return a `Promise` that eventually resolves to `true` if the key is mapped
   *         to a value, or `false` if it does not
   */
  containsKey (key: K): Promise<boolean>;

  /**
   * Returns `true` if the specified value is mapped to some key.
   *
   * @param value  the value expected to be associated with some key
   *
   * @return a `Promise` that eventually resolves to `true` if a mapping exists,
   *         or `false` if it does not
   *
   */
  containsValue (value: V): Promise<boolean>;

  /**
   * Get all the specified keys, if they are in the map. For each key that is in the map,
   * that key and its corresponding value will be placed in the map that is returned by
   * this method. The absence of a key in the returned map indicates that it was not in the cache,
   * which may imply (for caches that can load behind the scenes) that the requested data
   * could not be loaded.
   *
   * @param keys  an {@link Iterable} of keys that may be in this map
   *
   * @returns a `Promise` eventually returning a Map of keys to values for the specified keys
   *          passed in `keys`
   */
  getAll (keys: Iterable<K>): Promise<Map<K, V>>;

  /**
   * Returns the value to which this cache maps the specified key.
   *
   * @param key  the key whose associated value is to be returned
   *
   * @returns a `Promise` eventually returning the value to which the specified key is mapped,
   *          or `null` if this map contains no mapping for the key
   */
  get (key: K): Promise<V | null>;

  /**
   * Returns the value to which the specified key is mapped, or the specified `defaultValue`
   * if this map contains no mapping for the key.
   *
   * @return the value to which the specified key is mapped, or the specified `defaultValue`
   *         if this map contains no mapping for the key
   */
  getOrDefault (key: K, defaultValue: V): Promise<V | null>

  /**
   * Returns `true` if this map contains no key-value mappings.
   *
   * @return a `Promise` eventually returning `true` if this map contains no key-value mappings
   */
  isEmpty (): Promise<boolean>;

  /**
   * Associates the specified value with the specified key in this map. If the
   * map previously contained a mapping for this key, the old value is replaced.
   *
   * @param key    the key with which the specified value is to be associated
   * @param value  the value to be associated with the specified key
   * @param ttl    the expiry time in millis (optional)
   *
   * @return a `Promise` eventually returning the previous value associated with specified key,
   *         or `null` if there was no mapping for key. A `null` return can also indicate that the map
   *         previously associated `null` with the specified key, if the implementation supports `null` values
   */
  put (key: K, value: V, ttl?: number): Promise<V>;

  /**
   * If the specified key is not already associated with a value (or is mapped to null) associates
   * it with the given value and returns `nul`l, else returns the current value.
   *
   * @param key    the key with which the specified value is to be associated
   * @param value  the value to be associated with the specified key
   * @param ttl    the expiry time in millis
   *
   * @return a `Promise` eventually returning the previous value associated with the specified key, or
   *         `null` if there was no mapping for the key. (A `null` return can also indicate that the map previously
   *         associated `null` with the key, if the implementation supports `null` values.)
   */
  putIfAbsent (key: K, value: V, ttl?: number): Promise<V>

  /**
   * Removes the mapping for a key from this map if it is present.
   *
   * @param key  key whose mapping is to be removed from the map
   *
   * @return a `Promise` eventually returning the previous value associated with key,
   *         or null if there was no mapping for key
   */
  remove (key: K): Promise<V>;

  /**
   * Removes the entry for the specified key only if it is currently mapped to the specified value.
   *
   * @param key    key with which the specified value is associated
   * @param value  expected to be associated with the specified key
   *
   * @return a `Promise` eventually returning `true` if the value was removed
   */
  removeMapping (key: K, value: V): Promise<boolean>

  /**
   * Replaces the entry for the specified key only if it is currently mapped to some value.
   *
   * @param key    key with which the specified value is associated
   * @param value  value to be associated with the specified key
   *
   * @return a `Promise` eventually returning the previous value associated with the specified key,
   *         or `null` if there was no mapping for the key. (A `null` return can also indicate that the map
   *         previously associated `null` with the key, if the implementation supports `null` values.)
   */
  replace (key: K, value: V): Promise<V>;

  /**
   * Replaces the entry for the specified key only if currently mapped to the specified value.
   *
   * @param key       key whose associated value is to be removed
   * @param oldValue  value expected to be associated with the specified key
   * @param newValue  value to be associated with the specified key
   *
   * @return a `Promise` eventually returning `true` if the value was replaced
   */
  replaceMapping (key: K, oldValue: V, newValue: V): Promise<boolean>;

  /**
   * Returns the number of key-value mappings in this map.
   *
   * @return a `Promise` eventually returning the number of key-value mappings in this map
   */
  size (): Promise<number>;

  /**
   * Truncates the cache.  Unlike {@link clear}, this function does not generate
   * an event for each removed entry.
   */
  truncate (): Promise<void>;

  /**
   * Release and destroy this cache.
   * <p>
   * Warning: This method is used to completely destroy the specified cache
   * across the cluster. All references in the entire cluster to this cache
   * will be invalidated, the cached data will be cleared, and all resources
   * will be released.
   */
  destroy (): Promise<void>;

  /**
   * Return the name of this cache.
   *
   * @return the name of this cache
   */
  getCacheName (): string;

  /**
   * Returns `true` if this cache is active.
   *
   * @return `true` if this cache is active.
   */
  isActive (): boolean;

  /**
   * Release local resources associated with this cache.
   * <p>
   * The act of releasing the cache is scoped locally and does not affect the cache
   * within the Coherence cluster itself. In other words, all other references to the
   * cache will still be valid, and the cache data is not affected by releasing
   * the reference. Any attempt to use this reference afterword will result in an error.
   *
   * @return a `Promise` returning `null` once the cache has been released
   */
  release (): Promise<void>;

  /**
   * Attempt to lock the specified item within the specified period of time.
   * <p>
   * The item doesn't have to exist to be `locked`. While the item is
   * locked there is known to be a `lock holder` which has an exclusive
   * right to modify (calling put and remove methods) that item.
   * <p>
   * Lock holder is an abstract concept that depends on the ConcurrentMap
   * implementation. For example, holder could be a cluster member or
   * a thread (or both).
   * <p>
   * Locking strategy may vary for concrete implementations as well. Lock
   * could have an expiration time (this lock is sometimes called a "lease")
   * or be held indefinitely (until the lock holder terminates).
   * <p>
   * Some implementations may allow the entire map to be locked. If the map is
   * locked in such a way, then only a lock holder is allowed to perform
   * any of the "put" or "remove" operations.
   *
   * @param key    key being locked
   * @param cWait  the number of milliseconds to continue trying to obtain
   *               a lock; pass zero to return immediately; pass -1 to block
   *               the calling thread until the lock could be obtained
   *
   * @return true if the item was successfully locked within the
   *              specified time; false otherwise
   */
  lock(key: any, cWait?: number): boolean;

  /**
   * Unlock the specified item. The item doesn't have to exist to be
   * <i>unlocked</i>. If the item is currently locked, only
   * the <i>holder</i> of the lock could successfully unlock it.
   *
   * @param key  key being unlocked
   *
   * @return true if the item was successfully unlocked; false otherwise
   */
  unlock(key: any): boolean;

  /**
   * Perform an aggregating operation against the entries specified by the passed keys.
   *
   * @typeParam R  the type of value returned by the {@link EntryProcessor}
   *
   * @param keys        the {@link Iterable} of keys that specify the entries within this Map to aggregate across
   * @param aggregator  the {@link EntryAggregator} that is used to aggregate across the specified entries of this Map
   */
  aggregate<R, T, E> (keys: Iterable<K>, aggregator: EntryAggregator<K, V, T, E, R>): Promise<any>

  /**
   * Perform an aggregating operation against the set of entries that are selected by the given {@link Filter}.
   *
   * @typeParam R  the type of value returned by the {@link EntryProcessor}
   *
   * @param filter      the {@link Filter} that is used to select entries within this Map to aggregate across
   * @param aggregator  the {@link EntryAggregator} that is used to aggregate across the specified entries of this Map
   */
  aggregate<R, T, E> (filter: Filter<V>, aggregator: EntryAggregator<K, V, any, any, R>): Promise<any>

  /**
   * Perform an aggregating operation against all the entries.
   *
   * @typeParam R  the type of value returned by the {@link EntryProcessor}
   *
   * @param aggregator  the {@link EntryAggregator} that is used to aggregate across the specified entries of this Map
   */
  aggregate<R, T, E> (aggregator: EntryAggregator<K, V, T, E, R>): Promise<any>

  /**
   * Invoke the passed {@link EntryProcessor} against the {@link Entry} specified by the
   * passed key, returning the result of the invocation.
   *
   * @typeParam R  the type of value returned by the {@link EntryProcessor}
   *
   * @param key        the key to process; it is not required to exist within the Map
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
   * @param keys       the keys to process; these keys are not required to exist within the Map
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
  invokeAll<R> (filter: Filter<V>, processor: EntryProcessor<K, V, R>): Promise<Map<K, R>>

  on (event_name: CacheLifecycleEvent.TRUNCATED | CacheLifecycleEvent.DESTROYED, handler: (cacheName: string) => void): void;

  addMapListener (listener: MapListener<K, V>, isLite?: boolean): void;

  addMapListener (listener: MapListener<K, V>, key: K, isLite?: boolean): void;

  addMapListener (listener: MapListener<K, V>, filter: MapEventFilter, isLite?: boolean): void;
  /**
   * Add an index to this QueryMap.
   *
   * @remarks
   * Adds an index to this QueryMap. Example:
   * ```ts
   * cache.addIndex(Extractors.extract('name'));
   * ```
   *
   * @param extractor  - The ValueExtractor object that is used to extract
   *                     an indexable Object from a value stored in the
   *                     indexed Map. Must not be null.
   * @param ordered    - true iff the contents of the indexed information
   *                     should be ordered; false otherwise.
   * @param comparator - The Comparator object which imposes an ordering
   *                     on entries in the indexed map; or null if the
   *                     entries' values natural ordering should be used.
   * @typeparam <T>    - The type of the value to extract from.
   * @typeparam <E>    - The type of value that will be extracted.
   *
   * @returns            A Promise<void> that resolves when the operation
   *                     completes.
   */
  addIndex<T, E> (extractor: ValueExtractor<T, E>, ordered?: boolean, comparator?: ContainsAnyFilter<T, E>): Promise<void>;

  /**
   * Returns a {@link Set} view of the keys contained in this map.
   * The set is backed by the map, so changes to the map are
   * reflected in the set, and vice-versa.  If the map is modified
   * while an iteration over the set is in progress (except through
   * the iterator's own <tt>remove</tt> operation), the results of
   * the iteration are undefined.  The set supports element removal,
   * which removes the corresponding mapping from the map, via the
   * <tt>Iterator.remove</tt>, <tt>Set.remove</tt>,
   * <tt>removeAll</tt>, <tt>retainAll</tt>, and <tt>clear</tt>
   * operations.  It does not support the <tt>add</tt> or <tt>addAll</tt>
   * operations.
   *
   * @return a set view of the keys contained in this map
   */
  keySet (): RemoteSet<K>;

  /**
   * Return a set view of the keys contained in this map for entries that
   * satisfy the criteria expressed by the filter.
   * <p>
   * Unlike the {@link keySet()} method, the set returned by this method may
   * not be backed by the map, so changes to the set may not reflected in the
   * map, and vice-versa.
   * <p>
   * <b>Note: When using the Coherence Enterprise Edition or Grid Edition, the
   * Partitioned Cache implements the QueryMap interface using the Parallel
   * Query feature. When using Coherence Standard Edition, the Parallel Query
   * feature is not available, resulting in lower performance for most
   * queries, and particularly when querying large data sets.</b>
   *
   * @param filter the Filter object representing the criteria that the
   *               entries of this map should satisfy
   *
   * @return a set of keys for entries that satisfy the specified criteria
   */
  keySet (filter: Filter<any>, comparator?: Comparator): Promise<Set<K>>;

  entrySet (): RemoteSet<MapEntry<K, V>>;

  entrySet (filter: Filter<any>, comp?: Comparator): Promise<Set<MapEntry<K, V>>>;

  /**
   * Remove an index from this QueryMap.
   *
   * @remarks
   * Removes an index to this QueryMap. Example:
   * ```ts
   * cache.removeIndex(Extractors.extract('name'));
   * ```
   *
   * @param extractor - The ValueExtractor object that is used to extract
   *                    an indexable Object from a value stored in the
   *                    indexed Map. Must not be null.
   * @typeparam <T>   - The type of the value to extract from.
   * @typeparam <E>   - The type of value that will be extracted.
   *
   * @returns           A Promise<void> that resolves when the operation
   *                    completes.
   */
  removeIndex<T, E> (extractor: ValueExtractor<T, E>): Promise<void>;
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
  getKey (): K;

  /**
   * Returns the value corresponding to this entry.
   *
   * @return the value corresponding to this entry
   */
  getValue (): V;
}

export interface RemoteSet<T> {

  /**
   * Removes all of the elements from this set (optional operation).
   */
  clear (): Promise<void>;

  /**
   * Removes the specified element from this set if it is present (optional operation).
   *
   * @param value  the value to be removed from this set, if present
   *
   * @return a `Promise` resolving to `true` if the value was deleted, or `false` if not
   */
  delete (value: T): Promise<boolean>;

  /**
   * Returns `true` if this set contains the specified element.
   *
   * @param value  whose presence in this set is to be tested
   *
   * @return a `Promise` resolving to `true` if set contains the value, or `false` if not
   */
  has (value: T): Promise<boolean>;

  /**
   * Returns the number of elements in this set
   *
   * @return a `Promise` resolving to the number of elements in this set
   */
  size (): Promise<number>;

  /**
   * The iterator over this set.
   *
   * @return a iterator over this set
   */
  [Symbol.iterator] (): IterableIterator<T>
}