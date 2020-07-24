/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { AbstractDoubleAggregator } from '@aggregator/aggregator'
import { ValueExtractor } from '../extractor/value_extractor'

/**
 * Calculates an average for values of any numeric type extracted from a
 * set of entries in a Map in a form of a numerical value. All the
 * extracted objects will be treated as numerical values. If the set of
 * entries is empty, a null result is returned.
 *
 * @param <T>  the type of the value to extract from
 */
export class AverageAggregator<T>
  extends AbstractDoubleAggregator<T> {
  // constructor(extractor: ValueExtractor<T, number>);
  // constructor(property: string);
  constructor (extractorOrProperty: ValueExtractor<T, number> | string) {
    // ?? This doesn't work => super(clz, extractorOrProperty);
    if (extractorOrProperty instanceof ValueExtractor) {
      super('BigDecimalAverage', extractorOrProperty)
    } else {
      super('BigDecimalAverage', extractorOrProperty)
    }
  }
}
