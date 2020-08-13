/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { Filter } from '../filter/'
import { internal } from './package-internal'
import { EntryProcessor } from '.'

/**
 * ConditionalRemove is an EntryProcessor that performs an
 * remove operation if the specified condition is satisfied.
 *
 * While the ConditionalRemove processing could be implemented via direct
 * key-based NamedMap operations, it is more efficient and enforces
 * concurrency control without explicit locking.
 */
export class ConditionalRemove<K = any, V = any>
  extends EntryProcessor<K, V, V> {
  /**
   * The underlying filter.
   */
  protected readonly filter: Filter<V>

  /**
   * Specifies whether or not a return value is required.
   */
  protected 'return': boolean = true

  /**
   * Construct a ConditionalRemove processor that removes an NamedMap
   * entry if and only if the filter applied to the entry evaluates to `true`.
   * The result of the invocation does not return any result.
   *
   * @param filter       the filter to evaluate an entry
   * @param returnValue  specifies whether or not the processor should return
   *                     the current value if it has not been removed
   */
  constructor (filter: Filter<V>, returnValue?: boolean) {
    super(internal.processorName('ConditionalRemove'))

    this.filter = filter
    this.return = this.return = returnValue || true
  }

  /**
   * If called, it will cause the processor to return the current value in case it
   * has not been updated.
   *
   * @param returnCurrent specifies whether or not the processor should return
   *                      the current value in case it has not been updated
   */
  returnCurrent (returnCurrent: boolean = true): this {
    this.return = returnCurrent
    return this
  }
}
