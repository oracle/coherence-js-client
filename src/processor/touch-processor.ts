/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { EntryProcessor } from '.'
import { internal } from './package-internal'

/**
 * Touch entry processor.
 */
export class TouchProcessor<K, V>
  extends EntryProcessor<K, V, void> {
  /**
   * Construct a Touch EntryProcessor.
   */
  constructor () {
    super(internal.processorName('Touch'))
  }
}
