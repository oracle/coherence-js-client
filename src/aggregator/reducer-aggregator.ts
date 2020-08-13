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
 * The `ReducerAggregator` is used to implement functionality similar to
 * {@link NamedMap} *getAll()* API.  Instead of returning the complete
 * set of values, it will return a portion of value attributes based on the
 * provided {@link ValueExtractor}.
 *
 * This aggregator could be used in combination with {@link MultiExtractor} allowing one
 * to collect tuples that are a subset of the attributes of each object stored in
 * the cache.
 *
 * @typeParam K  the type of the Map entry keys
 * @typeParam V  the type of the Map entry values
 * @typeParam T  the type of the value to extract from
 * @typeParam E  the type of the extracted value
 */
export class ReducerAggregator<K, V, T, E>
  extends EntryAggregator<K, V, T, E, [MapEntry<K, V>]> {

  /**
   * Construct a new `ReducerAggregator`.
   *
   * @param extractorOrProperty  the extractor that provides values to aggregate or the name of the method that
   *                             could be invoked via Java reflection and that returns values to aggregate; this
   *                             parameter can also be a dot-delimited sequence of method names which would
   *                             result in an aggregator based on the {@link ChainedExtractor} that is based on
   *                             an array of corresponding {@link UniversalExtractor} objects
   */
  constructor (extractorOrProperty: ValueExtractor<T, number> | string) {
    super(internal.aggregatorName('ReducerAggregator'), extractorOrProperty)
  }
}