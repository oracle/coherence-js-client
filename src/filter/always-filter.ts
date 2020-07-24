/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { Filter } from '.'
import { internal } from './package-internal'

/**
 * Filter which always evaluates to `true`.
 *
 * @param <T> the type of the input argument to the filter.
 */
export class AlwaysFilter<T = any>
  extends Filter<T> {
  /**
   * Construct an AlwaysFilter.
   */
  constructor () {
    super(internal.filterName('AlwaysFilter'))
  }
}
