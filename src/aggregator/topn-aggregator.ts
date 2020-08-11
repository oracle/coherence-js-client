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
 * TODO (docs)
 */
export class TopAggregator<K, V, T, E>
  extends EntryAggregator<K, V, T, E, any> {

  protected results: number = 0
  protected inverse: boolean = false
  public extractor: IdentityExtractor<E> = new IdentityExtractor()
  protected comparator?: AggregatorComparator
  protected property?: string

  constructor (count: number) {
    super(internal.aggregatorName('TopNAggregator'))
    this.results = count
  }

  orderBy (property: string): TopAggregator<K, V, T, E> {
    this.property = property
    this.comparator = new AggregatorComparator(this.property, this.inverse)
    return this
  }

  ascending (): TopAggregator<K, V, T, E> {
    if (this.property) {
      this.inverse = true
      this.comparator = new AggregatorComparator(this.property, this.inverse)
    }
    return this
  }

  descending (): TopAggregator<K, V, T, E> {
    if (this.property) {
      this.inverse = false
      this.comparator = new AggregatorComparator(this.property, this.inverse)
    }
    return this
  }

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
