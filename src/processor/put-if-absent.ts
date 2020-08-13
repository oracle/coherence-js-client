/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */


import { internal } from './package-internal'
import { EntryProcessor } from '.'

/**
 * PutIfAbsent entry processor.
 *
 * @typeParam K  the type of the Map entry key
 * @typeParam V  the type of the Map entry value
 */
export class PutIfAbsent<K, V>
  extends EntryProcessor<K, V, void> {
  /**
   * Specifies the new value to update an entry with.
   */
  protected value: V

  /**
   * Construct a PutIfAbsent EntryProcessor.
   *
   * @param value  the value to update an entry with
   */
  constructor (value: V) {
    super(internal.processorName('PutIfAbsent'))

    this.value = value
  }
}
