/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { Filter } from '.'
import { internal } from './package-internal'

/**
 * Filter which returns true for entries that currently exist in a map.
 *
 * This Filter is intended to be used solely in combination with a
 * {@link ConditionalProcessor} and is unnecessary
 * for standard {@link NamedMap} operations.
 *
 * @typeParam T  the type of the input argument to the filter
 */
export class PresentFilter<T = any>
  extends Filter<T> {
  /**
   * Singleton `PresentFilter` instance
   */
  static readonly INSTANCE = new PresentFilter()

  /**
   * Construct a PresentFilter.
   */
  protected constructor () {
    super(internal.filterName('PresentFilter'))
  }
}
