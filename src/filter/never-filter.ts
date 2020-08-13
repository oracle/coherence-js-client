/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { Filter } from '.'
import { internal } from './package-internal'

/**
 * Filter which always evaluates to `false`.
 */
export class NeverFilter
  extends Filter {
  /**
   * Singleton `NeverFilter` instance.
   */
  static readonly INSTANCE: NeverFilter = new NeverFilter()

  /**
   * Construct a NeverFilter.
   */
  protected constructor () {
    super(internal.filterName('NeverFilter'))
  }
}
