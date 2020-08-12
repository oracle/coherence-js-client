/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { AbstractDoubleAggregator } from '.'
import { ValueExtractor } from '../extractor/'
import { internal } from './package-internal'

/**
 * Calculates an average for values of any numeric type extracted from a
 * set of entries in a Map in a form of a numerical value. All the
 * extracted objects will be treated as numerical values. If the set of
 * entries is empty, a `nul`l result is returned.
 *
 * @typeParam T  the type of the value to extract from
 */
export class AverageAggregator<T>
  extends AbstractDoubleAggregator<T> {

  /**
   * Construct an AverageAggregator that will sum numeric values extracted
   * from the cache entries.
   *
   * @param extractorOrProperty   the extractor that provides a value in the form of any numeric object or
   *                              the name of the method that could be invoked via Java reflection and that
   *                              returns numeric values to aggregate; this parameter can also be a dot-delimited
   *                              sequence of method names which would result in an aggregator based on the
   *                              {@link ChainedExtractor} that is based on an array of corresponding
   *                              {@link ReflectionExtractor} objects.  May not be null
   */
  constructor (extractorOrProperty: ValueExtractor<T, number> | string) {
    super(internal.aggregatorName('BigDecimalAverage'), extractorOrProperty);
  }
}
