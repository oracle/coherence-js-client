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
 * `ConditionalPut` is an EntryProcessor that performs an update operation for an entry
 * that satisfies the specified condition.
 *
 * While the `ConditionalPut` processing could be implemented via direct
 * key-based NamedMap operations, it is more efficient and enforces
 * concurrency control without explicit locking.
 *
 * Obviously, using more specific, fine-tuned filters (rather than ones based
 * on the IdentityExtractor) may provide additional flexibility and efficiency
 * allowing the put operation to be performed conditionally on values of
 * specific attributes (or even calculations) instead of the entire object.
 */
export class ConditionalPut<K = any, V = any>
  extends EntryProcessor<K, V, V> {
  /**
   * The underlying filter.
   */
  protected readonly filter: Filter<V>

  /**
   * Specifies the new value to update an entry with.
   */
  protected readonly value: V

  /**
   * Specifies whether or not a return value is required.
   */
  protected 'return': boolean = true

  /**
   * Construct a ConditionalPut that updates an entry with a new value if
   * and only if the filter applied to the entry evaluates to true.
   * The result of the invocation does not return any result.
   *
   * @param filter       the filter to evaluate an entry
   * @param value        a value to update an entry with
   * @param returnValue  specifies whether or not the processor should return
   *                     the current value in case it has not been updated
   */
  constructor (filter: Filter<V>, value: V, returnValue?: boolean) {
    super(internal.processorName('ConditionalPut'))

    this.filter = filter
    this.value = value
    this.return = returnValue || true
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
