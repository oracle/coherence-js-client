/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { CompositeUpdater, UniversalExtractor, UniversalUpdater } from '../extractor/'
import { PropertyProcessor, ValueManipulator } from '.'
import { internal } from './package-internal'

/**
 * The NumberIncrementor entry processor is used to increment a property value
 * of a numeric type.
 *
 * @typeParam K  the type of the Map entry key
 * @typeParam V  the type of the Map entry value
 */
export class NumberIncrementor<K = any, V = any>
  extends PropertyProcessor<K, V, number> {
  /**
   * The number to increment by.
   */
  protected increment: number

  /**
   * Whether to return the value before it was multiplied ("post-factor") or
   * after it is multiplied ("pre-factor").
   */
  protected postIncrement: boolean

  /**
   * Construct an NumberIncrementor processor that will increment a property
   * value by a specified amount, returning either the old or the new value
   * as specified.
   *
   * @param nameOrManipulator  the ValueManipulator or property name
   * @param increment          the Number representing the magnitude and sign of
   *                           the increment
   * @param postIncrement      pass `true` to return the value as it was before
   *                           it was incremented, or `pass` false to return the
   *                           value as it is after it is incremented
   */
  constructor (nameOrManipulator: ValueManipulator<V, number> | string, increment: number, postIncrement: boolean = false) {
    super(internal.processorName('NumberIncrementor'),
      typeof nameOrManipulator === 'string'
        ? NumberIncrementor.createCustomManipulator<V>(nameOrManipulator)
        : nameOrManipulator)

    this.increment = increment
    this.postIncrement = postIncrement
  }

  /**
   * Create the updater that will perform the manipulation of the value.
   *
   * @param name  the property name
   * @hidden
   */
  private static createCustomManipulator<V> (name: string): ValueManipulator<V, number> {
    return new CompositeUpdater(new UniversalExtractor(name), new UniversalUpdater(name))
  }

  /**
   * Configure the processor to return the value of the property *before* being incremented.
   */
  returnOldValue (): this {
    this.postIncrement = true
    return this
  }

  /**
   * Configure the processor to return the value of the property *after* being incremented.
   */
  returnNewValue (): this {
    this.postIncrement = false
    return this
  }
}
