/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { EntryProcessor } from '.'
import { internal } from './package-internal'

/**
 * `VersionedPut` is an {@link EntryProcessor} that assumes that entry values
 * are versioned (see Coherence Versionable interface for details) and performs an
 * update/insert operation if and only if the version of the specified value matches
 * the version of the corresponding value. `VersionedPutAll` will increment the version
 * indicator before each value is updated.
 */
export class VersionedPut<K, V>
  extends EntryProcessor<K, V, V> {
  /**
   * Specifies the new value to update an entry with.
   */
  protected readonly value: V

  /**
   * Specifies whether or not an insert is allowed.
   */
  protected readonly insert?: boolean

  /**
   * Specifies whether or not a return value is required.
   */
  protected 'return'?: boolean

  /**
   * Construct a `VersionedPut` that updates an entry with a new value if and
   * only if the version of the new value matches to the version of the
   * current entry's value. This processor optionally returns the current
   * value as a result of the invocation if it has not been updated (the
   * versions did not match).
   *
   * @param value          a value to update an entry with
   * @param allowInsert    specifies whether or not an insert should be
   *                       allowed (no currently existing value)
   * @param returnCurrent  specifies whether or not the processor should
   *                       return the current value in case it has not been
   *                       updated
   */
  constructor (value: V, allowInsert: boolean = false, returnCurrent: boolean = false) {
    super(internal.processorName('VersionedPut'))

    this.value = value
    this.insert = allowInsert
    this.return = returnCurrent
  }

  returnCurrent (returnCurrent: boolean = true): this {
    this.return = returnCurrent
    return this
  }
}
