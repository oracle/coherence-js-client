/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ValueExtractor } from '../extractor/'
import { NotEqualsFilter } from '.'
import { internal } from './package-internal'

/**
 * Filter which tests the result of a method invocation for inequality to `null`.
 */
export class IsNotNullFilter<T = any, E = any>
  extends NotEqualsFilter<T, E | null> {
  /**
   * Construct a IsNotNullFilter for testing inequality to `null`.
   *
   * @param extractorOrMethod  the ValueExtractor to use by this filter or
   *                           the name of the method to invoke via reflection
   */
  constructor (extractorOrMethod: ValueExtractor<T, E> | string) {
    super(extractorOrMethod, null)
    this['@class'] = internal.filterName('IsNotNullFilter')
  }
}
