/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ValueExtractor } from '../extractor/'
import { EqualsFilter } from '.'
import { internal } from './package-internal'

/**
 * Filter which compares the result of a method invocation with null.
 *
 * @author cp/gg 2002.10.27
 */
export class IsNullFilter<T = any, E = any>
  extends EqualsFilter<T, E> {
  /**
   * Construct a `IsNullFilter` for testing equality to `null`.
   *
   * @param extractorOrMethod the ValueExtractor to use by this filter or
   *                          the name of the method to invoke via reflection
   */
  constructor (extractorOrMethod: ValueExtractor<T, E> | string) {
    // @ts-ignore
    super(extractorOrMethod, null)
    this['@class'] = internal.filterName('IsNullFilter')
  }
}
