/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { AbstractComparableAggregator } from '.'
import { ValueExtractor } from '../extractor/'
import { internal } from './package-internal'

/**
 * Calculates a maximum of numeric values extracted from a set of
 * entries in a Map in a form of a numerical value. All the extracted
 * objects will be treated as numerical values. If the set of entries is
 * empty, a null result is returned.

 * @param <T>  the type of the value to extract from
 */
export class MaxAggregator<T>
  extends AbstractComparableAggregator<T, number> {
  constructor (extractorOrProperty: ValueExtractor<T, number> | string) {
    super(internal.aggregatorName('ComparableMax'), extractorOrProperty)
  }
}
