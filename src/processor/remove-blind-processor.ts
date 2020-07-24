/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */


import { internal } from './package-internal'
import { EntryProcessor } from '.'

/**
 * RemoveBlind entry processor.
 *
 * @param <K> the type of the Map entry key
 * @param <V> the type of the Map entry value
 */
export class RemoveBlindProcessor<K, V>
  extends EntryProcessor<K, V, void> {
  /**
   * Construct a RemoveBlind EntryProcessor.
   */
  constructor () {
    super(internal.processorName('RemoveBlind'))
  }
}
