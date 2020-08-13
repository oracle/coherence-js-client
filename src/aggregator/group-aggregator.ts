/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ValueExtractor } from '../extractor/'
import { Filter } from '../filter/'
import { EntryAggregator } from '.'
import { internal } from './package-internal'


/**
 * The `GroupAggregator` provides an ability to split a subset of entries
 * in a Map into a collection of non-intersecting subsets and then
 * aggregate them separately and independently. The splitting (grouping)
 * is performed using the results of the underlying {@link
  * UniversalExtractor} in such a way that two entries will belong to the
 * same group if and only if the result of the corresponding extract
 * call produces the same value or tuple (list of values). After the
 * entries are split into the groups, the underlying aggregator is
 * applied separately to each group. The result of the aggregation by
 * the` GroupAggregator` is a Map that has distinct values (or tuples) as
 * keys and results of the individual aggregation as
 * values. Additionally, those results could be further reduced using an
 * optional {@link Filter} object.
 *
 * Informally speaking, this aggregator is analogous to the SQL `group
 * by` and `having` clauses. Note that the `having` Filter is applied
 * independently on each server against the partial aggregation results;
 * this generally implies that data affinity is required to ensure that
 * all required data used to generate a given result exists within a
 * single cache partition. In other words, the `group by` predicate
 * should not span multiple partitions if the `having` clause is used.
 *
 * The `GroupAggregator` is somewhat similar to the DistinctValues
 * aggregator, which returns back a list of distinct values (tuples)
 * without performing any additional aggregation work.
 *
 * @typeParam K  the type of the Map entry keys
 * @typeParam V  the type of the Map entry values
 * @typeParam T  the type of the value to extract from
 * @typeParam E  the type of the extracted value
 * @typeParam R  the type of the group aggregator result
 */
export class GroupAggregator<K, V, T, E, R>
  extends EntryAggregator<K, V, any, any, Map<E, R>> {
  /**
   * The underlying {@link EntryAggregator}.
   */
  protected aggregator: EntryAggregator<K, V, any, any, R>

  /**
   * The {@link Filter} object representing the `having` clause of this `group by`
   * aggregator.
   */
  protected filter?: Filter

  /**
   * Construct a `GroupAggregator` based on a specified {@link ValueExtractor} and
   * underlying {@link EntryAggregator}.
   *
   * @param extractorOrProperty   a ValueExtractor object that is used to split entries into non-intersecting
   *                              subsets; may not be `null`. This parameter can also be a dot-delimited
   *                              sequence of method names which would result in an aggregator based on the
   *                              {@link ChainedExtractor} that is based on an array of corresponding
   *                              {@link UniversalExtractor} objects; may not be `null`
   * @param aggregator  an EntryAggregator object; may not be null
   * @param filter      an optional Filter object used to filter out
   *                    results of individual group aggregation results
   */
  constructor (extractorOrProperty: ValueExtractor<T, E> | string, aggregator: EntryAggregator<K, V, T, E, R>, filter?: Filter) {
    super(internal.aggregatorName('GroupAggregator'), extractorOrProperty)

    if (aggregator) {
      this.aggregator = aggregator
    } else {
      throw new Error('no aggregator provided')
    }
    this.filter = filter
  }
}
