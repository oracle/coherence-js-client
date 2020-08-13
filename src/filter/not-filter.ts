/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { Filter } from '.'
import { internal } from './package-internal'

/**
 * Filter which negates the results of another filter.
 */
export class NotFilter<T = any>
  extends Filter<T> {

  /**
   * The Filter whose results are negated by this filter.
   */
  protected filter: Filter<T>

  /**
   * Construct a negation filter.
   *
   * @param filter  the filter whose results this Filter negates
   */
  constructor (filter: Filter<T>) {
    super(internal.filterName('NotFilter'))
    this.filter = filter
  }
}
