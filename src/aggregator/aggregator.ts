/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { UniversalExtractor, ValueExtractor } from '../extractor/'
import { MapEntry, Util } from '../util/'
import { CompositeAggregator } from '.'

/**
 * An EntryAggregator represents processing that can be directed to occur
 * against some subset of the entries in an InvocableMap, resulting in a
 * aggregated result. Common examples of aggregation include functions such
 * as min(), max() and avg(). However, the concept of aggregation applies to
 * any process that needs to evaluate a group of entries to come up with a
 * single answer.
 *
 * @param <K> the type of the Map entry keys
 * @param <V> the type of the Map entry values
 * @param <R> the type of the value returned by the EntryAggregator
 */
export interface EntryAggregator<K = any, V = any, R = any> {
  andThen (aggregator: EntryAggregator<K, V, R>): EntryAggregator<K, V, R>
}

/**
 * A StreamingAggregator is an extension of {@link EntryAggregator} that
 * processes entries in a streaming fashion.
 *
 * @param <K> the type of the Map entry keys
 * @param <V> the type of the Map entry values
 * @param <P> the type of the partial result
 * @param <R> the type of the final result
 *
 * @see EntryAggregator
 */
export interface StreamingAggregator<K = any, V = any, P = any, R = any>
  extends EntryAggregator<K, V, R> {
}

/**
 * Abstract base class implementation of {@link EntryAggregator}
 * that supports streaming aggregation.
 *
 * @param <K> the type of the Map entry key
 * @param <V> the type of the Map entry value
 * @param <T> the type of the value to extract from
 * @param <E> the type of the extracted value to aggregate
 * @param <R> the type of the aggregation result
 *
 * @since Coherence 3.1
 */
export abstract class AbstractAggregator<K = any, V = any, T = any, E = any, R = any>
  implements StreamingAggregator<K, V, any, R> {
  '@class': string
  extractor: ValueExtractor<T, E>

  protected constructor (clz: string, extractorOrProperty: ValueExtractor<T, E> | string) {
    this['@class'] = Util.toAggregatorName(clz)
    if (extractorOrProperty instanceof ValueExtractor) {
      this.extractor = extractorOrProperty
    } else {
      this.extractor = new UniversalExtractor(extractorOrProperty)
    }
  }

  // noinspection JSUnusedLocalSymbols
  aggregate (entries: Set<MapEntry<K, V>>): R {
    throw new Error('aggregate not implemented')
  }

  andThen (aggregator: EntryAggregator<K, V, R>): EntryAggregator<K, V, R> {
    return new CompositeAggregator(this, aggregator)
  }
}

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
export abstract class AbstractDoubleAggregator<T>
  extends AbstractAggregator<any, any, T, number, number> {
  // protected constructor(clz: string, extractor: ValueExtractor<T, number>);
  // protected constructor(clz: string, property: string);
  protected constructor (clz: string, extractorOrProperty: ValueExtractor<T, number> | string) {
    // ?? This doesn't work => super(clz, extractorOrProperty);
    if (extractorOrProperty instanceof ValueExtractor) {
      super(clz, extractorOrProperty)
    } else {
      super(clz, extractorOrProperty)
    }
  }
}