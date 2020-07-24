/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { EntryProcessor } from '.'
import { internal } from './package-internal'

/**
 * VersionedPut is an entry processor that performs a remove
 * operation if the specified condition is satisfied.
 *
 */
export class VersionedPutProcessor<K, V>
  extends EntryProcessor<K, V, V> {
  /**
   * The underlying filter.
   */
  value: V

  /**
   * Specifies whether or not an insert is allowed.
   */
  insert?: boolean

  /**
   * Specifies whether or not a return value is required.
   */
  'return'?: boolean

  /**
   * Construct a ConditionalPut that updates an entry with a new value if
   * and only if the filter applied to the entry evaluates to true.
   * The result of the {@link process()} invocation does not return any
   * result.
   *
   * JS Objects must have a '@version' attribute.
   *
   * @param filter  the filter to evaluate an entry
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
