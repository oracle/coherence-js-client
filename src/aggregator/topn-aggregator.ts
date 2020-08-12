/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { EntryAggregator } from '.'
import { IdentityExtractor } from '../extractor'
import { Extractors } from '..'
import { Comparator } from '../util'
import { internal } from './package-internal'

/**
 * `TopAggregator` aggregates the top *N* extracted values into an array.  The extracted values must not be `null`,
 * but do not need to be unique.
 *
 * @typeParam K  the type of the Map entry keys
 * @typeParam V  the type of the Map entry values
 * @typeParam T  the type of the value to extract from
 * @typeParam E  the type of the extracted value
 */
export class TopAggregator<K, V, T, E>
  extends EntryAggregator<K, V, T, E, any> {

  /**
   * The maximum number of results to include in the aggregation result.
   */
  protected results: number = 0

  /**
   * Result order.  By default, results will be ordered in descending order.
   */
  protected inverse: boolean = false

  /**
   * The extractor to obtain the values to aggregate.  If not explicitly set,
   * this will default to an {@link IdentityExtractor}.
   */
  protected extractor: IdentityExtractor<E> = new IdentityExtractor()

  /**
   * The {@link Comparator} to apply against the extracted values.
   */
  protected comparator?: AggregatorComparator
  protected property?: string

  /**
   * Constructs a new `TopAggregator`.
   *
   * @param count  the number of results to include in the aggregation result
   */
  constructor (count: number) {
    super(internal.aggregatorName('TopNAggregator'))
    this.results = count
  }

  /**
   * Order the results based on the values of the specified property.
   *
   * @param property the property name
   */
  orderBy (property: string): TopAggregator<K, V, T, E> {
    this.property = property
    this.comparator = new AggregatorComparator(this.property, this.inverse)
    return this
  }

  /**
   * Sort the returned values in ascending order.
   */
  ascending (): TopAggregator<K, V, T, E> {
    if (this.property) {
      this.inverse = true
      this.comparator = new AggregatorComparator(this.property, this.inverse)
    }
    return this
  }

  /**
   * Sort the returned values in descending order.
   */
  descending (): TopAggregator<K, V, T, E> {
    if (this.property) {
      this.inverse = false
      this.comparator = new AggregatorComparator(this.property, this.inverse)
    }
    return this
  }

  /**
   * The property name of the value to extract.
   *
   * @param property  the property name
   */
  extract (property: string): TopAggregator<K, V, T, E> {
    this.inverse = true
    this.extractor = Extractors.extract(property)
    return this
  }
}

class AggregatorComparator implements Comparator {
  '@class': string
  protected comparator: object

  constructor (property: string, isAsc: boolean) {
    let sortTypeName = 'comparator.InverseComparator'
    if (!isAsc) {
      sortTypeName = 'comparator.SafeComparator'
    }
    let propertyName = property
    this['@class'] = sortTypeName

    this.comparator = {
      '@class': 'comparator.ExtractorComparator',
      'extractor': Extractors.extract(propertyName)
    }
  }
}
