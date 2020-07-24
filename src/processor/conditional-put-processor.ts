/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { Filter } from '../filter/'
import { internal } from './package-internal'
import { EntryProcessor } from '.'

export class ConditionalPutProcessor<K = any, V = any>
  extends EntryProcessor<K, V, V> {
  /**
   * The underlying filter.
   */
  filter: Filter<V>

  /**
   * Specifies the new value to update an entry with.
   */
  value: V

  /**
   * Specifies whether or not a return value is required.
   */
  'return': boolean = true

  /**
   * Construct a ConditionalPut that updates an entry with a new value if
   * and only if the filter applied to the entry evaluates to true.
   * The result of the {@link process()} invocation does not return any
   * result.
   *
   * @param filter  the filter to evaluate an entry
   * @param value   a value to update an entry with
   */
  constructor (filter: Filter<V>, value: V, returnValue?: boolean) {
    super(internal.processorName('ConditionalPut'))

    this.filter = filter
    this.value = value
    this.return = returnValue || true
  }

  returnCurrent (returnCurrent?: boolean): this {
    this.return = returnCurrent || true
    return this
  }

  doesReturnValue (): boolean {
    return this.return
  }

  getValue (): V {
    return this.value
  }
}