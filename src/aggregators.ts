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

export class Aggregators {
  static average<K, V, T> (extractorOrProperty: ValueExtractor<T, number> | string): EntryAggregator<K, V, T, number, number> {
    if (extractorOrProperty instanceof ValueExtractor) {
      return new AverageAggregator(extractorOrProperty as ValueExtractor<T, number>)
    }
    return new AverageAggregator(extractorOrProperty)
  }

  static count<K, V> (): EntryAggregator<K, V, any, number, number> {
    return new CountAggregator()
  }

  static distinct<K, V, T> (extractorOrProperty: ValueExtractor<T, number> | string): EntryAggregator<K, V, T, number, number> {
    if (extractorOrProperty instanceof ValueExtractor) {
      return new DistinctValuesAggregator(extractorOrProperty as ValueExtractor<T, number>)
    }
    return new DistinctValuesAggregator(extractorOrProperty)
  }

  static groupBy<K, V, T, E, R> (extractorOrProperty: ValueExtractor<T, E> | string, aggregator: EntryAggregator<K, V, T, E, T>, filter: Filter): EntryAggregator<K, V, T, E, Map<E, R>> {
    if (extractorOrProperty instanceof ValueExtractor) {
      return new GroupAggregator(extractorOrProperty as ValueExtractor<T, number>, aggregator, filter)
    }
    return new GroupAggregator(extractorOrProperty, aggregator, filter)
  }

  static min<K, V, T> (extractorOrProperty: ValueExtractor<T, number> | string): EntryAggregator<K, V, T, number, number> {
    if (extractorOrProperty instanceof ValueExtractor) {
      return new MinAggregator(extractorOrProperty as ValueExtractor<T, number>)
    }
    return new MinAggregator(extractorOrProperty)
  }

  static max<T> (extractorOrProperty: ValueExtractor<T, number> | string): MaxAggregator<T> {
    if (extractorOrProperty instanceof ValueExtractor) {
      return new MaxAggregator(extractorOrProperty as ValueExtractor<T, number>)
    }
    return new MaxAggregator(extractorOrProperty)
  }

  static priority<K, V, R>(aggregator: EntryAggregator<K, V, any, any, R>, schedulingPriority: Schedule = Schedule.STANDARD,
                           executionTimeout: number = Timeout.DEFAULT, requestTimeout: number = Timeout.DEFAULT): PriorityAggregator<K, V, R> {
    const priorityAgg = new PriorityAggregator(aggregator)
    priorityAgg.executionTimeoutInMillis = executionTimeout
    priorityAgg.requestTimeoutInMillis = requestTimeout
    priorityAgg.schedulingPriority = schedulingPriority
    return priorityAgg
  }

  static record<K, V>(type: RecordType = RecordType.EXPLAIN) : QueryRecorder<K, V> {
    return new QueryRecorder<K, V>(type)
  }

  static reduce<K, V, T, R>(extractorOrProperty: ValueExtractor<T, R> | string): ReducerAggregator<K, V, T, R> {
    return new ReducerAggregator<K, V, T, R>(extractorOrProperty)
  }

  static script<K, V, T, R>(language: string, name: string, args: [object]): ScriptAggregator<K, V, T, R> {
    return new ScriptAggregator<K, V, T, R>(language, name, args)
  }

  static sum<T> (extractorOrProperty: ValueExtractor<T, number> | string): SumAggregator<T> {
    if (extractorOrProperty instanceof ValueExtractor) {
      return new SumAggregator(extractorOrProperty as ValueExtractor<T, number>)
    }
    return new SumAggregator(extractorOrProperty)
  }

  static top<K, V, R> (count: number): TopAggregator<K, V, any, R> {
    return new TopAggregator<K, V, any, R>(count)
  }
}
