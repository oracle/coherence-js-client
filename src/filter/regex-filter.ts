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
 * Filter which uses the regular expression pattern match defined by the
 * Java's `String.matches` contract. This implementation is not index
 * aware and will not take advantage of existing indexes.
 *
 * @typeParam T  the type of the input argument to the filter
 * @typeParam E  the type of the extracted attribute to use for comparison
 */
export class RegexFilter<T = any, E = any>
  extends ComparisonFilter<T, E, string> {
  /**
   *
   * @param extractorOrMethod  the {@link ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param regex              the regular expression to match the result with
   */
  constructor (extractorOrMethod: ValueExtractor<T, E> | string, regex: string) {
    super(internal.filterName('RegexFilter'), extractorOrMethod, regex)
  }
}
