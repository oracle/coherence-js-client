/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ValueExtractor } from '../extractor/value_extractor'
import { AbstractDoubleAggregator } from './abstract_double_aggregator'

/**
 * Return the set of unique values extracted from a set of entries in a
 * Map. If the set of entries is empty, an empty set is returned.
 *
 * This aggregator could be used in combination with {@link
  * UniversalExtractor} allowing to collect all unique combinations
 * (tuples) of a given set of attributes.
 *
 * The DistinctValues aggregator covers a simple case of a more generic
 * aggregation pattern implemented by the GroupAggregator, which in
 * addition to collecting all distinct values or tuples, runs an
 * aggregation against each distinct entry set (group).
 *
 * @param <T>  the type of the value to extract from
 */
export class DistinctValuesAggregator<T>
  extends AbstractDoubleAggregator<T> {
  // constructor(extractor: ValueExtractor<T, number>);
  // constructor(property: string);
  constructor (extractorOrProperty: ValueExtractor<T, number> | string) {
    // ?? This doesn't work => super(clz, extractorOrProperty);
    if (extractorOrProperty instanceof ValueExtractor) {
      super('DistinctValues', extractorOrProperty)
    } else {
      super('DistinctValues', extractorOrProperty)
    }
  }
}
