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
import { Comparator, Map, RemoteSet } from '../util'

/**
 * A Map-based data-structure that manages entries across one or more processes.
 * Entries are typically managed in memory, and are often comprised of data
 * that is also stored persistently, on disk.
 *
 * @typeParam K  the type of the map entry keys
 * @typeParam v  the type of the map entry values
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
   * Signifies whether or not this `NamedMap` has been destroyed.
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
   * @param keys  an {@link Iterable} of keys that may be in this map
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
   *         to the specified value value, or `false` if it does not
   */
  hasEntry(key: K, value: V): Promise<boolean>

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
   * If the specified key is not already associated with a value (or is mapped to `null`) associates
   * it with the given value and returns `nul`l, else returns the current value.
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
   * @param keys    the keys to process these keys are not required to
   *                exist within the Map
   * @param action  the action to be performed for each entry
   */
  forEach (keys: Iterable<K>, action: (value: V, key: K) => void): Promise<void>

  /**
   * Perform an aggregating operation against the entries specified by the passed keys.
   *
   * @typeParam R  the type of value returned by the {@link EntryProcessor}
   *
   * @param keys        the {@link Iterable} of keys that specify the entries within this Map to aggregate across
   * @param aggregator  the {@link EntryAggregator} that is used to aggregate across the specified entries of this Map
   */
  aggregate<R, T, E> (keys: Iterable<K>, aggregator: EntryAggregator<K, V, T, E, R>): Promise<R>

  /**
   * Perform an aggregating operation against the set of entries that are selected by the given {@link Filter}.
   *
   * @typeParam R  the type of value returned by the {@link EntryProcessor}
   *
   * @param filter      the {@link Filter} that is used to select entries within this Map to aggregate across
   * @param aggregator  the {@link EntryAggregator} that is used to aggregate across the specified entries of this Map
   */
  aggregate<R, T, E> (filter: Filter<V>, aggregator: EntryAggregator<K, V, any, any, R>): Promise<R>

  /**
   * Perform an aggregating operation against all the entries.
   *
   * @typeParam R  the type of value returned by the {@link EntryProcessor}
   *
   * @param aggregator  the {@link EntryAggregator} that is used to aggregate across the specified entries of this Map
   */
  aggregate<R, T, E> (aggregator: EntryAggregator<K, V, T, E, R>): Promise<R>

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
  invokeAll<R> (filter: Filter<V>, processor: EntryProcessor<K, V, R>): Promise<Map<K, R>>

  /**
   * Allows registration of a handler to be notified of cache lifecycle events.
   *
   * @param eventName  the event
   * @param handler    the event handler
   */
  on (eventName: CacheLifecycleEvent.RELEASED | CacheLifecycleEvent.TRUNCATED | CacheLifecycleEvent.DESTROYED, handler: (cacheName: string) => void): void

  /**
   * Add a standard map listener that will receive all events (inserts,
   * updates, deletes) that occur against the map, with the key, old-value
   * and new-value included. This has the same result as the following call:
   * ```
   *   addMapListener(listener, (Filter) null, false);
   * ```
   *
   * @param listener the {@link MapEvent} listener to add
   */
  addMapListener (listener: MapListener<K, V>): void

  /**
   * Remove a standard map listener that previously signed up for all
   * events. This has the same result as the following call:
   * ```
   *   removeMapListener(listener, (Filter) null);
   * ```
   *
   * @param listener the listener to remove
   */
  removeMapListener (listener: MapListener<K, V>): Promise<void>;

  /**
   * Add a map listener for a specific key.
   *
   * The listeners will receive {@link MapEvent} objects, but if `isLite` is passed as
   * `true`, they *might* not contain the `OldValue` and `NewValue`
   * properties.
   *
   * To unregister the {@link MapListener], use the `NamedMap.removeMapListener(MapListener, K)` method.
   *
   * @param listener  the {@link MapEvent} listener to add
   * @param key       the key that identifies the entry for which to raise
   *                  events
   * @param isLite    `true` to indicate that the {@link MapEvent} objects do
   *                  not have to include the `OldValue` and `NewValue`
   *                  property values in order to allow optimizations
   */
  addMapListener (listener: MapListener<K, V>, key: K, isLite?: boolean): void

  /**
   * Remove a map listener that previously signed up for events about a
   * specific key.
   *
   * @param listener  the listener to remove
   * @param key       the key that identifies the entry for which to raise
   *                  events
   */
  removeMapListener (listener: MapListener<K, V>, key: K): Promise<void>;

  /**
   * Add a map listener that receives events based on a filter evaluation.
   *
   * The listeners will receive {@link MapEvent} objects, but if `isLite` is passed as
   * `true`, they *might* not contain the `OldValue` and `NewValue`
   * properties.
   *
   * To unregister the {@link MapListener}, use the `NamedMap.remoteMapListener(MapListener, Filter)`
   *
   * @param listener  the {@link MapEvent} listener to add
   * @param filter    a filter that will be passed MapEvent objects to select
   *                  from; a {@link MapEvent} will be delivered to the listener only
   *                  if the filter evaluates to true for that MapEvent (see {@link MapEventFilter});
   *                  `null` is equivalent to a filter that always returns `true`
   * @param isLite    `true` to indicate that the {@link MapEvent} objects do
   *                  not have to include the `OldValue` and `NewValue`
   *                  property values in order to allow optimizations
   */
  addMapListener (listener: MapListener<K, V>, filter: MapEventFilter<K, V>, isLite?: boolean): void

  /**
   * Add an index to this map.
   *
   * @remarks
   * Adds an index to this map. Example:
   * ```javascript
   * cache.addIndex(Extractors.extract('name'))
   * ```
   *
   * @param extractor  - The ValueExtractor object that is used to extract
   *                     an indexable Object from a value stored in the
   *                     indexed Map. Must not be null.
   * @param ordered    - true iff the contents of the indexed information
   *                     should be ordered false otherwise.
   * @param comparator - The Comparator object which imposes an ordering
   *                     on entries in the indexed map or null if the
   *                     entries' values natural ordering should be used.
   * @typeparam <T>    - The type of the value to extract from.
   * @typeparam <E>    - The type of value that will be extracted.
   *
   * @returns            A Promise<void> that resolves when the operation
   *                     completes.
   */
  addIndex<T, E> (extractor: ValueExtractor<T, E>, ordered?: boolean, comparator?: ContainsAnyFilter<T, E>): Promise<void>

  /**
   * Returns a {@link Set} view of the keys contained in this map.
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
   * not be backed by the map, so changes to the set may not reflected in the
   * map, and vice-versa.
   *
   * @param filter      the Filter object representing the criteria that the
   *                    entries of this map should satisfy
   * @param comparator  the comparator for sorting
   *
   * @return a set of keys for entries that satisfy the specified criteria
   */
  keys (filter: Filter, comparator?: Comparator): Promise<RemoteSet<K>>

  /**
   * Returns a {@link Set} view of the mappings contained in this map.
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
   * @typeParam T  The type of the value to extract from.
   * @typeParam E  The type of value that will be extracted.
   *
   * @param extractor  The ValueExtractor object that is used to extract
   *                   an indexable Object from a value stored in the
   *                   indexed Map. Must not be `null`.
   *
   * @return  A `Promise` that resolves when the operation completes.
   */
  removeIndex<T, E> (extractor: ValueExtractor<T, E>): Promise<void>

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
  getKey (): K

  /**
   * Returns the value corresponding to this entry.
   *
   * @return the value corresponding to this entry
   */
  getValue (): V
}

