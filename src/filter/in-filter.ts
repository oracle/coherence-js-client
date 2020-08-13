/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ValueExtractor } from '../extractor/'
import { ComparisonFilter } from '.'
import { internal } from './package-internal'

/**
 * Filter which checks whether the result of a method invocation belongs to a
 * predefined set of values.
 */
export class InFilter<T = any, E = any>
  extends ComparisonFilter<T, E, Set<E>> {

  /**
   * Construct an InFilter for testing `In` condition.
   *
   * @param extractorOrMethod  the ValueExtractor to use by this filter or
   *                           the name of the method to invoke via reflection
   * @param setValues          the set of values to compare the result with
   */
  constructor (extractorOrMethod: ValueExtractor<T, E> | string, setValues: Set<E>) {
    super(internal.filterName('InFilter'), extractorOrMethod, setValues)
  }
}
