/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { EntryProcessor } from '.'
import { internal } from './package-internal'

/**
 * VersionedPutAll entry processor.
 *
 * @param <K> the type of the Map entry key
 * @param <V> the type of the Map entry value
 */
export class VersionedPutAllProcessor<K, V>
  extends EntryProcessor<K, V, void> {
  /**
   * Specifies the new value to update an entry with.
   */
  entries: internal.MapHolder<K, V>

  /**
   * Specifies whether or not an insert is allowed.
   */
  insert?: boolean

  /**
   * Specifies whether or not a return value is required.
   */
  'return'?: boolean

  /**
   * Construct a PutAll EntryProcessor.
   *
   * @param filter  the filter to evaluate an entry
   * @param value   a value to update an entry with
   */
  constructor (entries: Map<K, V>, allowInsert: boolean = false, returnCurrent: boolean = false) {
    super(internal.processorName('VersionedPutAll'))
    this.entries = new internal.MapHolder(entries)
    this.insert = allowInsert
    this.return = returnCurrent
  }
}
