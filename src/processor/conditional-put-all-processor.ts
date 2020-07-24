/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { Filter } from '../filter/'
import { EntryProcessor } from '.'
import { internal } from './package-internal'


export class ConditionalPutAllProcessor<K = any, V = any>
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
  constructor (filter: Filter<V>, entries: Map<K, V>) {
    super(internal.processorName('ConditionalPutAll'))

    this.filter = filter
    this.entries = new internal.MapHolder(entries)
  }
}
