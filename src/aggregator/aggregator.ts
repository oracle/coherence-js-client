/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { UniversalExtractor, ValueExtractor } from '../extractor/'

/**
 * An EntryAggregator represents processing that can be directed to occur
 * against some subset of the entries in an cache, resulting in a
 * aggregated result. Common examples of aggregation include functions such
 * as min(), max() and avg(). However, the concept of aggregation applies to
 * any process that needs to evaluate a group of entries to come up with a
 * single answer.
 *
 * @typeParam K  the type of the Map entry key
 * @typeParam V  the type of the Map entry value
 * @typeParam T  the type of the value to extract from
 * @typeParam E  the type of the extracted value to aggregate
 * @typeParam R  the type of the aggregation result
 */
export abstract class EntryAggregator<K, V, T, E, R> {
  /**
   * Server-side EntryAggregator implementation type identifier.
   */
  protected '@class': string

  /**
   * The {@link ValueExtractor} to apply when aggregating results.
   *
   */
  protected extractor?: ValueExtractor<T, E>

  /**
   * Construct an AbstractAggregator that will aggregate values extracted from the cache entries.
   *
   * @param clz                  the server-side EntryAggregator implementation type identifier
   * @param extractorOrProperty  the extractor that provides values to aggregate or the name of the method that
   *                             could be invoked via Java reflection and that returns values to aggregate; this
   *                             parameter can also be a dot-delimited sequence of method names which would
   *                             result in an aggregator based on the {@link ChainedExtractor} that is based on
   *                             an array of corresponding {@link ReflectionExtractor} objects; must not be `null`
   */
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
 * Abstract aggregator that processes values extracted from a set of entries
 * in a Map, with knowledge of how to compare those values. There are two way
 * to use the AbstractComparableAggregator:
 * <ul>
 * <li>All the extracted objects must implement the Java Comparable interface, or</li>
 * <li>The AbstractComparableAggregator has to be provided with a
 * {@link Comparator} object.</li>  This {@link Comparator} must exist on the server in order
 * to be usable.
 * </ul>
 * If there are no entries to aggregate, the returned result will be `null`.
 *
 * @typeParam T  the type of the value to extract from
 * @typeParam R  the type of the aggregation result
 */
export abstract class AbstractComparableAggregator<T, R>
  extends EntryAggregator<any, any, T, R, R> {
  /**
   * Construct an AbstractComparableAggregator that will aggregate Java-Comparable values extracted
   * from the cache entries.
   *
   * @param clz                  the server-side EntryAggregator implementation type identifier
   * @param extractorOrProperty  the extractor that provides values to aggregate or the name of the method that
   *                             could be invoked via Java reflection and that returns values to aggregate; this
   *                             parameter can also be a dot-delimited sequence of method names which would
   *                             result in an aggregator based on the {@link ChainedExtractor} that is based on
   *                             an array of corresponding {@link ReflectionExtractor} objects
   */
  protected constructor (clz: string, extractorOrProperty: ValueExtractor<T, R> | string) {
    super(clz, extractorOrProperty)
  }
}

/**
 * Abstract aggregator that processes numeric values extracted from a set of
 * entries in a Map. All the extracted Number objects will be treated as Java
 * <tt>double</tt> values and the result of the aggregator is a Double.
 * If the set of entries is empty, a <tt>null</tt> result is returned.
 *
 * @typeParam T  the type of the value to extract from
 */
export abstract class AbstractDoubleAggregator<T>
  extends EntryAggregator<any, any, T, number, number> {

  /**
   * Construct an AbstractComparableAggregator that will aggregate numeric values extracted
   * from the cache entries.
   *
   * @param clz                  the server-side EntryAggregator implementation type identifier
   * @param extractorOrProperty  the extractor that provides values to aggregate or the name of the method that
   *                             could be invoked via Java reflection and that returns values to aggregate; this
   *                             parameter can also be a dot-delimited sequence of method names which would
   *                             result in an aggregator based on the {@link ChainedExtractor} that is based on
   *                             an array of corresponding {@link ReflectionExtractor} objects
   */
  protected constructor (clz: string, extractorOrProperty: ValueExtractor<T, number> | string) {
    super(clz, extractorOrProperty);
  }
}