/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */


import { internal } from './package-internal'
import { EntryProcessor } from '.'

/**
 * Put entry processor.
 *
 * @param <K> the type of the Map entry key
 * @param <V> the type of the Map entry value
 */
export class PutIfAbsentProcessor<K, V>
  extends EntryProcessor<K, V, void> {
  /**
   * Specifies the new value to update an entry with.
   */
  value: V

  /**
   * Construct a PutIfAbsent EntryProcessor.
   *
   * @param value   a value to update an entry with
   */
  constructor (value: V) {
    super(internal.processorName('PutIfAbsent'))

    this.value = value
  }

  getValue (): V {
    return this.value
  }
}
