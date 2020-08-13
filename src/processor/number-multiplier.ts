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
 * NumberMultiplier entry processor.
 *
 * @param <K> the type of the Map entry key
 * @param <V> the type of the Map entry value
 */
export class NumberMultiplier<K = any, V = any>
  extends PropertyProcessor<K, V, number> {
  /**
   The number to multiply by.
   */
  protected multiplier: number

  /**
   * Whether to return the value before it was multiplied (`post-factor`) or
   * after it is multiplied (`pre-factor`).
   */
  protected postMultiplication: boolean

  /**
   * Construct an NumberMultiplier processor that will multiply a property
   * value by a specified factor, returning either the old or the new value
   * as specified.
   *
   * @param nameOrManipulator   the ValueManipulator or the property name
   * @param multiplier          the Number representing the magnitude and sign of
   *                            the multiplier
   * @param postMultiplication  pass true to return the value as it was before
   *                            it was multiplied, or pass false to return the
   *                            value as it is after it is multiplied
   */
  constructor (nameOrManipulator: ValueManipulator<V, number> | string, multiplier: number, postMultiplication: boolean = false) {
    super(internal.processorName('NumberMultiplier'),
      typeof nameOrManipulator === 'string'
        ? NumberMultiplier.createCustomManipulator<V>(nameOrManipulator)
        : nameOrManipulator)

    this.multiplier = multiplier
    this.postMultiplication = postMultiplication
  }

  // uses UniversalExtractor and UniversalUpdater respectively.
  private static createCustomManipulator<V> (name: string): ValueManipulator<V, number> {
    return new CompositeUpdater(new UniversalExtractor(name), new UniversalUpdater(name))
  }

  /**
   * Configure the processor to return the value of the property *before* being multiplied.
   */
  returnOldValue (): this {
    this.postMultiplication = true
    return this
  }

  /**
   * Configure the processor to return the value of the property *after* being incremented.
   */
  returnNewValue (): this {
    this.postMultiplication = false
    return this
  }
}
