/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ObservableMap } from '../util/observable_map'
import { RemoteCache } from './remote_cache'

/**
 * Get all the specified keys, if they are in the cache. For each key
 * that is in the cache, that key and its corresponding value will be
 * placed in the map that is returned by this method. The absence of
 * a key in the returned map indicates that it was not in the cache,
 * which may imply (for caches that can load behind the scenes) that
 * the requested data could not be loaded.
 *
 * @param <K>  the type of the map entry keys.
 * @param <V>  the type of the map entry values.
 */
export interface CacheMap<K, V>
  extends RemoteCache<K, V>, ObservableMap<K, V> {

  /**
   * Get all the specified keys, if they are in the cache. For each key
   * that is in the cache, that key and its corresponding value will be
   * placed in the map that is returned by this method. The absence of
   * a key in the returned map indicates that it was not in the cache,
   * which may imply (for caches that can load behind the scenes) that
   * the requested data could not be loaded.
   *
   * @returns A Promise that will eventually to a Map<K, V> containing
   *          the mappings for the specified keys. The absence of
   *          a key in the returned map indicates that it was not in
   *          the cache, which may imply (for caches that can load
   *          behind the scenes) that the requested data could not be
   *          loaded.
   */
  getAll (keys: Iterable<K>): Promise<Map<K, V>>;

  /**
   * Returns the value to which this cache maps the specified key.
   *
   * @param key  The key whose associated value is to be returned.
   *
   * @returns A Promise that will eventually resolve to the value that
   *          is associated with the specified key.
   */
  get (key: K): Promise<V | null>;

  /**
   * Associates the specified value with the specified key in this map. If the
   * map previously contained a mapping for this key, the old value is replaced.
   *
   * @param key   The key with which the specified value is to be associated.
   * @param value The value to be associated with the specified key.
   * @param ttl   The expiry time in millis.
   *
   * @return A Promise that will eventually resolve to the previous value that
   *         was associated with the specified key.
   */
  put (key: K, value: V, ttl?: number): Promise<V>;

  /**
   * Associates the specified value with the specified key in this map. If the
   * map previously contained a mapping for this key, the old value is replaced.
   * This variation of the {@link #put(Object oKey, Object oValue)}
   * method allows the caller to specify an expiry (or "time to live")
   * for the cache entry.
   *
   * @param key   The key with which the specified value is to be associated.
   * @param value The value to be associated with the specified key.
   * @param ttl   The expiry time in millis.
   *
   * @return A Promise that will eventually resolve to the previous value that
   *         was associated with the specified key.
   * @throws An error if the requested expiry is a positive value and the
   *         implementation does not support expiry of cache entries.
   */
  put (key: K, value: V, ttl: number): Promise<V>;

}
