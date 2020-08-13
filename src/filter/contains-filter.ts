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
 * Filter which tests a collection or array value returned from
 * a method invocation for containment of a given value.
 *
 * @typeParam T  the type of the input argument to the filter
 * @typeParam E  the type of the extracted attribute to use for comparison
 */
export class ContainsFilter<T = any, E = any>
  extends ComparisonFilter<T, E, E> {

  /**
   * Construct an ContainsFilter for testing containment of the given
   * object.
   *
   * @param extractorOrMethod  the {@link ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param value              the object that a collection or array is tested
   *                           to contain
   */
  constructor (extractorOrMethod: ValueExtractor<T, E> | string, value: E) {
    super(internal.filterName('ContainsFilter'), extractorOrMethod, value)
  }
}
