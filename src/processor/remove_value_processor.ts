/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { BaseProcessor } from './base_processor'

/**
 * RemoveValue entry processor.
 *
 * @param <K> the type of the Map entry key
 * @param <V> the type of the Map entry value
 */
export class RemoveValueProcessor<K, V>
  extends BaseProcessor<K, V, void> {
  /**
   * Specifies the value that shopuld exist in the Cache.
   */
  value: V

  /**
   * Construct a Put EntryProcessor.
   *
   * @param value   The value that must exiost in the Cache.
   */
  constructor (value: V) {
    super('RemoveValue')

    this.value = value
  }
}
