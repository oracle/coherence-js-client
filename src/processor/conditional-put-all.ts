/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { Filter } from '../filter/'
import { EntryProcessor } from '.'
import { Map } from '../util'
import { internal } from './package-internal'

/**
 * /**
 * ConditionalPutAll is an EntryProcessor that performs an update operation for multiple entries
 * that satisfy the specified condition.
 *
 * This allows for concurrent insertion/update of values within the cache.
 * For example a concurrent `replaceAll(map)` could be implemented as:
 * ```javascript
 *   filter = PresentFilter.INSTANCE;
 *   cache.invokeAll(map.keys(), new ConditionalPutAll(filter, map));
 * ```
 *
 * or `putAllIfAbsent` could be done by inverting the filter:
 * ```javascript
 *   filter = new NotFilter(PresentFilter.INSTANCE);
 * ```
 *
 * Obviously, using more specific, fine-tuned filters may provide additional
 * flexibility and efficiency allowing the multi-put operations to be
 * performed conditionally on values of specific attributes (or even
 * calculations) instead of a simple existence check.
 */
export class ConditionalPutAll<K = any, V = any>
  extends EntryProcessor<K, V, V> {
  /**
   * The underlying filter.
   */
  filter: Filter<V>

  /**
   * Specifies the new value to update an entry with.
   */
  entries: internal.MapHolder<K, V>

  /**
   * Construct a ConditionalPutAll processor that updates an entry with a
   * new value if and only if the filter applied to the entry evaluates to
   * true. The new value is extracted from the specified map based on the
   * entry's key.
   *
   * @param filter  the filter to evaluate all supplied entries
   * @param map     a map of values to update entries with
   */
  constructor (filter: Filter<V>, map: Map<K, V>) {
    super(internal.processorName('ConditionalPutAll'))

    this.filter = filter
    this.entries = new internal.MapHolder(map)
  }
}
