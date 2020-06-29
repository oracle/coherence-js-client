/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { BaseProcessor } from './base_processor'

/**
 * RemoveBlind entry processor.
 *
 * @param <K> the type of the Map entry key
 * @param <V> the type of the Map entry value
 */
export class RemoveBlindProcessor<K, V>
  extends BaseProcessor<K, V, void> {
  /**
   * Construct a RemoveBlind EntryProcessor.
   */
  constructor () {
    super('RemoveBlind')
  }
}
