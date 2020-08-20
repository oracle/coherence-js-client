/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import {
  AverageAggregator,
  CountAggregator,
  DistinctValuesAggregator,
  EntryAggregator,
  GroupAggregator,
  MaxAggregator,
  MinAggregator,
  PriorityAggregator,
  QueryRecorder,
  RecordType,
  ReducerAggregator,
  Schedule,
  ScriptAggregator,
  SumAggregator,
  Timeout,
  TopAggregator
} from './aggregator'
import { ValueExtractor } from './extractor/'
import { Filter } from './filter/'

/**
 * Simple Aggregator DSL.
 *
 * @remarks
 * The methods in this class are for the most part simple factory methods for
 * various {@link EntryAggregator} classes, but in some cases provide additional type
 * safety. They also tend to make the code more readable, especially if imported
 * statically, so their use is strongly encouraged in lieu of direct construction
 * of EntryAggregator} classes.
 */
export class Aggregators {

  /**
   * Return an aggregator that calculates a average of the numeric values extracted
   * from a set of entries in a Map.
   *
   * @typeParam K  the type of the entry's key
   * @typeParam V  the type of the entry's value
   * @typeParam T  the type of the value to extract from
   *
   * @param extractorOrProperty  the extractor or method/property name to provide values for aggregation
   *
   * @return an aggregator that calculates a average of the numeric values extracted
   *         from a set of entries in a Map
   */
  static average<K, V, T> (extractorOrProperty: ValueExtractor<T, number> | string): EntryAggregator<K, V, T, number, number> {
    return new AverageAggregator(extractorOrProperty)
  }

  /**
   * Return an aggregator that calculates a number of values in an entry set.
   *
   * @typeParam K  the type of the entry's key
   * @typeParam V  the type of the entry's value
   * @typeParam T  the type of the value to extract from
   *
   * @return an aggregator that calculates a number of values in an entry set
   */
  static count<K, V> (): EntryAggregator<K, V, any, number, number> {
    return new CountAggregator()
  }

  /**
   * Return an aggregator that calculates the set of distinct values from the entries in a Map.
   *
   * @param extractorOrProperty  the extractor or method/property name to provide values for aggregation
   *
   * @return an aggregator that calculates the set of distinct values from the entries in a Map
   */
  static distinct<K, V, T> (extractorOrProperty: ValueExtractor<T, number> | string): EntryAggregator<K, V, T, number, number> {
    return new DistinctValuesAggregator(extractorOrProperty)
  }

  /**
   * Return a {@link GroupAggregator} based on a specified property or method name(s)
   * and an {@link EntryAggregator}.
   *
   * @typeParam K  the type of the Map entry keys
   * @typeParam V  the type of the Map entry values
   * @typeParam T  the type of the value to extract from
   * @typeParam E  the type of the extracted value
   * @typeParam R  the type of the group aggregator result
   *
   * @param extractorOrProperty  the extractor or method/property name to provide values for aggregation
   * @param aggregator           an underlying {@link EntryAggregator}
   * @param filter               an optional {@link Filter} object used to filter out results
   *                             of individual group aggregation results
   *
   * @return a new {@link GroupAggregator}
   */
  static groupBy<K, V, T, E, R> (extractorOrProperty: ValueExtractor<T, E> | string, aggregator: EntryAggregator<K, V, T, E, T>, filter: Filter): EntryAggregator<K, V, T, E, Map<E, R>> {
    return new GroupAggregator(extractorOrProperty, aggregator, filter)
  }

  /**
   * Return an aggregator that calculates a minimum of the numeric values extracted
   * from a set of entries in a Map.
   *
   * @typeParam K  the type of the entry's key
   * @typeParam V  the type of the entry's value
   * @typeParam T  the type of the value to extract from
   *
   * @param extractorOrProperty  the extractor or method/property name to provide values for aggregation
   *
   * @return an aggregator that calculates a minimum of the numeric values extracted
   *         from a set of entries in a Map
   */
  static min<K, V, T> (extractorOrProperty: ValueExtractor<T, number> | string): EntryAggregator<K, V, T, number, number> {
    return new MinAggregator(extractorOrProperty)
  }

  /**
   * Return an aggregator that calculates a maximum of the numeric values extracted
   * from a set of entries in a Map.
   *
   * @typeParam K  the type of the entry's key
   * @typeParam V  the type of the entry's value
   * @typeParam T  the type of the value to extract from
   *
   * @param extractorOrProperty  the extractor or method/property name to provide values for aggregation
   *
   * @return an aggregator that calculates a maximum of the numeric values extracted
   *         from a set of entries in a Map
   */
  static max<T> (extractorOrProperty: ValueExtractor<T, number> | string): MaxAggregator<T> {
    return new MaxAggregator(extractorOrProperty)
  }

  /**
   * Return a new {@link PriorityAggregator} to control scheduling priority of an aggregation
   * operation.
   *
   * @typeParam K  the type of the Map entry keys
   * @typeParam V  the type of the Map entry values
   * @typeParam R  the type of the final result
   *
   * @param aggregator          the underlying {@link EntryAggregator}
   * @param schedulingPriority  the {@link Schedule} priority
   * @param executionTimeout    the execution {@link Timeout}
   * @param requestTimeout      the request {@link Timeout}
   */
  static priority<K, V, R>(aggregator: EntryAggregator<K, V, any, any, R>, schedulingPriority: Schedule = Schedule.STANDARD,
                           executionTimeout: number = Timeout.DEFAULT, requestTimeout: number = Timeout.DEFAULT): PriorityAggregator<K, V, R> {
    const priorityAgg = new PriorityAggregator(aggregator)
    priorityAgg.executionTimeoutInMillis = executionTimeout
    priorityAgg.requestTimeoutInMillis = requestTimeout
    priorityAgg.schedulingPriority = schedulingPriority
    return priorityAgg
  }

  /**
   * Returns a new {@link QueryRecorder} aggregator which may be used is used to produce an object that
   * contains an estimated or actual cost of the query execution for a given {@link Filter}.
   *
   * @typeParam K  the type of the Map entry keys
   * @typeParam V  the type of the Map entry values
   *
   * @param type the {@link RecordType}
   *
   * @return a new {@link QueryRecorder} aggregator which may be used is used to produce an object that
   *         contains an estimated or actual cost of the query execution for a given {@link Filter}
   */
  static record<K, V>(type: RecordType = RecordType.EXPLAIN) : QueryRecorder<K, V> {
    return new QueryRecorder<K, V>(type)
  }

  /**
   * Return an aggregator that will return the extracted value for each entry in the map.
   *
   * @typeParam K  the type of the Map entry keys
   * @typeParam V  the type of the Map entry values
   * @typeParam T  the type of the value to extract from
   * @typeParam R  the type of the group aggregator result
   *
   * @param extractorOrProperty  the extractor or method/property name to provide values for aggregation
   */
  static reduce<K, V, T, R>(extractorOrProperty: ValueExtractor<T, R> | string): ReducerAggregator<K, V, T, R> {
    return new ReducerAggregator<K, V, T, R>(extractorOrProperty)
  }

  /**
   * Return an aggregator that is implemented in a script using the specified
   * language.
   *
   * @typeParam K  the type of the Map entry keys
   * @typeParam V  the type of the Map entry values
   * @typeParam P  the type of the partial result
   * @typeParam R  the type of the group aggregator result
   *
   * @param language  the string specifying one of the supported languages
   * @param name      the aggregator name
   * @param args      arguments to pass to the aggregator
   *
   * @return an aggregator that is implemented in a script using the specified
   *         language
   */
  static script<K, V, P, R> (language: string, name: string, args: any[]): ScriptAggregator<K, V, P, R> {
    return new ScriptAggregator<K, V, P, R>(language, name, args)
  }

  /**
   * Return an aggregator that calculates a sum of the numeric values extracted
   * from a set of entries in a Map.
   *
   * @typeParam T  the type of the value to extract from
   *
   * @param extractorOrProperty  the extractor or method/property name to provide values for aggregation
   *
   * @return an aggregator that calculates a sum of the numeric values extracted
   *         from a set of entries in a Map
   */
  static sum<T> (extractorOrProperty: ValueExtractor<T, number> | string): SumAggregator<T> {
    return new SumAggregator(extractorOrProperty)
  }

  /**
   * Return an aggregator that aggregates the top *N* extracted values into an array.
   *
   * @param count  the maximum number of results to include in the aggregation result
   */
  static top<K, V, R> (count: number): TopAggregator<K, V, any, R> {
    return new TopAggregator<K, V, any, R>(count)
  }
}
