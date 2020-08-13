/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ValueExtractor } from '../extractor/'
import { AndFilter, GreaterEqualsFilter,  GreaterFilter, LessEqualsFilter, LessFilter} from '.'
import { internal } from './package-internal'

/**
 * Filter which compares the result of a method invocation with a value for
 * "Between" condition.  We use the standard ISO/IEC 9075:1992 semantic,
 * according to which "X between Y and Z" is equivalent to "X &gt;= Y &amp;&amp; X &lt;= Z".
 * In a case when either result of a method invocation or a value to compare
 * are equal to null, the <tt>evaluate</tt> test yields <tt>false</tt>.
 * This approach is equivalent to the way the NULL values are handled by SQL.
 *
 * @typeParam T  the type of the input argument to the filter
 * @typeParam E  the type of the extracted attribute to use for comparison
 */
export class BetweenFilter<T = any, E = any>
  extends AndFilter {

  /**
   * Lower bound of range.
   */
  protected from: E

  /**
   * Upper bound of range.
   */
  protected to: E

  /**
   * Construct a BetweenFilter for testing "Between" condition.
   *
   * @param extractorOrMethod  the {@link ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param from               the lower bound of the range
   * @param to                 the upper bound of the range
   * @param includeLowerBound  a flag indicating whether values matching the lower bound evaluate to true
   * @param includeUpperBound  a flag indicating whether values matching the upper bound evaluate to true
   */
  constructor (extractorOrMethod: ValueExtractor<T, E> | string, from: E, to: E,
               includeLowerBound: boolean = false, includeUpperBound: boolean = false) {
    super(includeLowerBound
      ? new GreaterEqualsFilter(extractorOrMethod, from)
      : new GreaterFilter(extractorOrMethod, from),
      includeUpperBound
        ? new LessEqualsFilter(extractorOrMethod, to)
        : new LessFilter(extractorOrMethod, to)
    )

    this['@class'] = internal.filterName('BetweenFilter')
    this.from = from
    this.to = to
  }
}
