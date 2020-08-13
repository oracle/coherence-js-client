/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { EntryAggregator } from '.'
import { internal } from './package-internal'

/**
 * Calculates a number of values in an entry set.
 */
export class CountAggregator<K, V>
  extends EntryAggregator<K, V, any, any, number> {

  /**
   * Constructs a new `CountAggregator`.
   */
  constructor () {
    super(internal.aggregatorName('Count'))
  }
}
