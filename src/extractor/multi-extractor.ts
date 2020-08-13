/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import {
  AbstractCompositeExtractor,
  ChainedExtractor,
  UniversalExtractor,
  ValueExtractor
} from '.'
import { internal } from './package-internal'

/**
 * Composite ValueExtractor implementation based on an array of extractors.
 * All extractors in the array are applied to the same target object and the
 * result of the extraction is a array of extracted values.
 *
 * Common scenarios for using the MultiExtractor involve the
 * `DistinctValuesAggregator` or `GroupAggregator` aggregators that allow clients
 * to collect all distinct combinations of a given set of attributes or collect
 * and run additional aggregation against the corresponding groups of entries.
 */
export class MultiExtractor
  extends AbstractCompositeExtractor<any, any> {
  /**
   * Constructs a new `MultiExtractor`.
   *
   * @param extractorsOrMethod  an array of {@link ValueExtractor}s or a comma-delimited
   *                            of method names which results in a MultiExtractor that
   *                            is based on a corresponding array of {@link ValueExtractor} objects
   */
  constructor (extractorsOrMethod: ValueExtractor<any, any>[] | string) {
    super(internal.extractorName('MultiExtractor'),
      ((typeof extractorsOrMethod === 'string')
        ? MultiExtractor.createExtractors(extractorsOrMethod)
        : extractorsOrMethod))
  }

  /**
   * Parse a comma-delimited sequence of method names and instantiate
   * a corresponding array of {@link ValueExtractor} objects.
   *
   * @param methods  a comma-delimited sequence of method names
   *
   * @return an array of {@link ValueExtractor} objects
   */
  protected static createExtractors (methods: string): ValueExtractor<any, any>[] {
    const names = methods.split(',').filter(f => f != null && f.length > 0)
    const arr = new Array<ValueExtractor<any, any>>()
    for (const name of names) {
      arr.concat(name.indexOf('.') < 0 ? new UniversalExtractor(name) : new ChainedExtractor(name))
    }

    return arr
  }
}
