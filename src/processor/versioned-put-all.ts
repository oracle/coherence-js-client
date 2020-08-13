/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { EntryProcessor } from '.'
import { internal } from './package-internal'
import { Map } from '../util'

/**
 * `VersionedPutAll` is an {@link EntryProcessor} that assumes that entry values
 * are versioned (see Coherence Versionable interface for details) and performs an
 * update/insert operation only for entries whose versions match to versions
 * of the corresponding current values. In case of the match, the
 * `VersionedPutAll` will increment the version indicator before each value is
 * updated.
 *
 * @typeParam K  the type of the Map entry key
 * @typeParam V  the type of the Map entry value
 */
export class VersionedPutAll<K, V>
  extends EntryProcessor<K, V, void> {
  /**
   * Specifies the new value to update an entry with.
   */
  protected readonly entries: internal.MapHolder<K, V>

  /**
   * Specifies whether or not an insert is allowed.
   */
  protected readonly insert?: boolean

  /**
   * Specifies whether or not a return value is required.
   */
  protected readonly 'return'?: boolean

  /**
   * Construct a VersionedPutAll processor that updates an entry with a new
   * value if and only if the version of the new value matches to the
   * version of the current entry's value (which must exist). This processor
   * optionally returns a map of entries that have not been updated (the
   * versions did not match).
   *
   * @param map            a map of values to update entries with
   * @param allowInsert    specifies whether or not an insert should be
   *                       allowed (no currently existing value)
   * @param returnCurrent  specifies whether or not the processor should
   *                       return the entries that have not been updated
   */
  constructor (map: Map<K, V>, allowInsert: boolean = false, returnCurrent: boolean = false) {
    super(internal.processorName('VersionedPutAll'))
    this.entries = new internal.MapHolder(map)
    this.insert = allowInsert
    this.return = returnCurrent
  }
}
