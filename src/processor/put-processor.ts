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
export class PutProcessor<K, V>
  extends EntryProcessor<K, V, void> {
  /**
   * Specifies the new value to update an entry with.
   */
  value: V

  /**
   * The "Time to live" property.
   */
  ttl: number = 0

  /**
   * Construct a Put EntryProcessor.
   *
   * @param filter  the filter to evaluate an entry
   * @param value   a value to update an entry with
   */
  constructor (value: V, ttl: number = 0) {
    super(internal.processorName('Put'))

    this.value = value
    this.ttl = ttl
  }

  getValue (): V {
    return this.value
  }
}
