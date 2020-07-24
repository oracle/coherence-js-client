/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { internal } from './package-internal'
import { EntryProcessor } from '.'

/**
 * PreloadRequest entry processor.
 */
export class PreloadRequestProcessor<K = any, V = any>
  extends EntryProcessor<K, V, void> {
  /**
   * Construct a PreloadRequest EntryProcessor.
   */
  constructor () {
    super(internal.processorName('PreloadRequest'))
  }
}
