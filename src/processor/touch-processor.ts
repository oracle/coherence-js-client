/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { EntryProcessor } from '.'
import { internal } from './package-internal'

/**
 * Touches an entry (if present) in order to trigger interceptor re-evaluation
 * and possibly increment expiry time.
 */
export class TouchProcessor<K, V>
  extends EntryProcessor<K, V, void> {
  /**
   * Construct a `Touch` {@link EntryProcessor}.
   */
  constructor () {
    super(internal.processorName('TouchProcessor'))
  }
}
