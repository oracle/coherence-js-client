/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { EntryAggregator } from '.'
import { internal } from './package-internal'

/**
 * CompositeAggregator provides an ability to execute a collection of
 * aggregators against the same subset of the entries in an
 * Map, resulting in a list of corresponding aggregation
 * results. The size of the returned list will always be equal to the
 * length of the aggregators' array.
 */
export class CompositeAggregator<K = any, V = any>
  extends EntryAggregator<K, V, any, any, Array<any>> {
  aggregators: Array<EntryAggregator<any, any, any, any, any>>

  constructor (aggregators: Array<EntryAggregator<any, any, any, any, any>>,) {
    super(internal.aggregatorName('CompositeAggregator'))
    this.aggregators = aggregators
  }
}
