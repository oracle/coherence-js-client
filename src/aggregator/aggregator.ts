/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { CompositeAggregator } from '.'
import { UniversalExtractor, ValueExtractor } from '../extractor/'

/**
 * TODO(rlubke) docs
 *
 * @typeParam K  the type of the Map entry key
 * @typeParam V  the type of the Map entry value
 * @typeParam T  the type of the value to extract from
 * @typeParam E  the type of the extracted value to aggregate
 * @typeParam R  the type of the aggregation result
 */
export abstract class EntryAggregator<K, V, T, E, R> {
  '@class': string
  extractor?: ValueExtractor<T, E>

  protected constructor (clz: string, extractorOrProperty?: ValueExtractor<T, E> | string) {
    this['@class'] = clz
    if (extractorOrProperty) {
      if (extractorOrProperty instanceof ValueExtractor) {
        this.extractor = extractorOrProperty
      } else {
        this.extractor = new UniversalExtractor(extractorOrProperty)
      }
    }
  }
}

/**
 * TODO(rlubke) docs
 */
export abstract class AbstractComparableAggregator<T, R>
  extends EntryAggregator<any, any, T, R, R> {
  protected constructor (clz: string, extractorOrProperty: ValueExtractor<T, R> | string) {
    super(clz, extractorOrProperty)
  }
}

/**
 * TODO(rlubke) docs
 */
export abstract class AbstractDoubleAggregator<T>
  extends EntryAggregator<any, any, T, number, number> {
  protected constructor (clz: string, extractorOrProperty: ValueExtractor<T, number> | string) {
    super(clz, extractorOrProperty);
  }
}