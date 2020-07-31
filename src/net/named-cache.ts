/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { NamedMap } from './named-map'

/**
 * A Map-based data-structure that manages entries across one or more processes.
 * Entries are typically managed in memory, and are often comprised of data
 * that is also stored in an external system, for example a database, or data
 * that has been assembled or calculated at some significant cost.  Such
 * entries are referred to as being <i>cached</i>.
 *
 * @typeParam K  the type of the map entry keys
 * @typeParam v  the type of the map entry values
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
   * @return a `Promise` eventually returning the previous value associated with specified key,
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
   * @return a `Promise` eventually returning the previous value associated with the specified key, or
   *         `null` if there was no mapping for the key. (A `null` return can also indicate that the map previously
   *         associated `null` with the key, if the implementation supports `null` values.)
   */
  setIfAbsent (key: K, value: V, ttl?: number): Promise<V | null>
}