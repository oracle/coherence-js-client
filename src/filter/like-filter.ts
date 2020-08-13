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
 * Filter which compares the result of a method invocation with a value for
 * pattern match. A pattern can include regular characters and wildcard
 * characters `_` and `%`.
 *
 * During pattern matching, regular characters must exactly match the
 * characters in an evaluated string. Wildcard character `_` (underscore) can
 * be matched with any single character, and wildcard character `%` can be
 * matched with any string fragment of zero or more characters.
 *
 * @typeParam T the type of the input argument to the filter
 * @typeParam E the type of the value to use for comparison
 */
export class LikeFilter<T = any, E = any>
  extends ComparisonFilter<T, E, string> {
  escapeChar: string
  ignoreCase: boolean

  /**
   * Construct a `LikeFilter` for pattern match.
   *
   * @param extractorOrMethod  the ValueExtractor to use by this filter or the name
   *                           of the method to invoke via reflection
   * @param pattern            the string pattern to compare the result with
   * @param escapeChar         the escape character for escaping `%` and `_`
   * @param ignoreCase         `true` to be case-insensitive
   */
  constructor (extractorOrMethod: ValueExtractor<T, E>, pattern: string, escapeChar: string = '0', ignoreCase: boolean = false) {
    super(internal.filterName('LikeFilter'), extractorOrMethod, pattern)

    this.escapeChar = escapeChar.length === 1 ? escapeChar : '0'
    this.ignoreCase = ignoreCase || false
  }
}
