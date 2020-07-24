/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { Util } from '../util/util'
import { EntryAggregator, StreamingAggregator } from './aggregator'
import { CompositeAggregator } from './composite_aggregator'

/**
 * Sums up numeric values extracted from a set of entries in a Map. All the
 * extracted Number objects will be treated as Java <tt>double</tt> values.
 *
 * @param <T>  the type of the value to extract from
 */
export class CountAggregator<K, V>
  implements StreamingAggregator<K, V, number, number> {
  '@class': string

  constructor () {
    this['@class'] = Util.toAggregatorName('Count')
  }

  andThen<R> (aggregator: EntryAggregator<K, V, R>): CompositeAggregator<K, V> {
    return new CompositeAggregator(this, aggregator)
  }
}
