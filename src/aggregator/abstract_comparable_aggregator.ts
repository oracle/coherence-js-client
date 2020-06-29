/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ValueExtractor } from '../extractor/value_extractor'
import { AbstractAggregator } from './aggregator'

/**
 * Abstract base class implementation of {@link EntryAggregator}
 * that supports streaming aggregation.
 *
 * @param <K>  the type of the Map entry key
 * @param <V>  the type of the Map entry value
 * @param <T>  the type of the value to extract from
 * @param <E>  the type of the extracted value to aggregate
 * @param <R>  the type of the aggregation result
 *
 * @since Coherence 3.1
 */
export abstract class AbstractComparableAggregator<T, R>
  extends AbstractAggregator<any, any, T, R, R> {
  protected constructor (clz: string, extractorOrProperty: ValueExtractor<T, R> | string) {
    // ?? This doesn't work => super(clz, extractorOrProperty);
    if (extractorOrProperty instanceof ValueExtractor) {
      super(clz, extractorOrProperty)
    } else {
      super(clz, extractorOrProperty)
    }
  }
}
