/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { EntryAggregator } from '.'
import { internal } from './package-internal'

/**
 * Sums up numeric values extracted from a set of entries in a Map. All the
 * extracted Number objects will be treated as Java <tt>double</tt> values.
 *
 * @param <T>  the type of the value to extract from
 */
export class CountAggregator<K, V>
  extends EntryAggregator<K, V, any, any, number> {

  constructor () {
    super(internal.aggregatorName('Count'))
  }
}
