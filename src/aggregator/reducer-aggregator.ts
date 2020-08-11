/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { EntryAggregator } from '.'
import { ValueExtractor } from '../extractor'
import { Extractors } from '../extractors'
import { MapEntry } from '../net'
import { internal } from './package-internal'

/**
 * TODO (docs)
 */
export class ReducerAggregator<K, V, T, E>
  extends EntryAggregator<K, V, T, E, [MapEntry<K, V>]> {

  constructor (extractorOrProperty: ValueExtractor<T, number> | string) {
    super(internal.aggregatorName('ReducerAggregator'),
      extractorOrProperty instanceof ValueExtractor
        ? extractorOrProperty as ValueExtractor<T, E>
        : Extractors.extract(extractorOrProperty))
  }
}