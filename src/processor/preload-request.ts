/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { internal } from './package-internal'
import { EntryProcessor } from '.'

/**
 * PreloadRequest is a simple EntryProcessor that performs a get call.
 * No results are reported back to the caller.
 * <p>
 * The PreloadRequest process provides a means to "pre-load" an entry or a
 * collection of entries into the cache using the cache loader without
 * incurring the cost of sending the value(s) over the network. If the
 * corresponding entry (or entries) already exists in the cache, or if the
 * cache does not have a loader, then invoking this EntryProcessor has no
 * effect.
 */
export class PreloadRequest<K = any, V = any>
  extends EntryProcessor<K, V, void> {
  /**
   * Construct a PreloadRequest EntryProcessor.
   */
  constructor () {
    super(internal.processorName('PreloadRequest'))
  }
}
