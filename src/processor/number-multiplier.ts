/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { CompositeUpdater } from '../extractor/composite_updater'
import { UniversalExtractor } from '@extractor/universal-extractor'
import { UniversalUpdater } from '@extractor/universal-updater'
import { PropertyProcessor } from './property_processor'
import { ValueManipulator } from './value_manipulator'

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
  multiplier: number

  /**
   * Whether to return the value before it was multiplied ("post-factor") or
   * after it is multiplied ("pre-factor").
   */
  postMultiplication: boolean

  /**
   * Construct a NumberMultiplier EntryProcessor.
   *
   * @param filter  The number to multiply by.
   * @param value   a value to update an entry with
   */
  constructor (nameOrManipulator: ValueManipulator<V, number> | string, multiplier: number, postMultiplication: boolean = false) {
    if (typeof nameOrManipulator === 'string') {
      // Need to create a ValueManipulator
      super('NumberMultiplier', NumberMultiplier.createCustomManipulator<V>(nameOrManipulator))
    } else {
      super('NumberMultiplier', nameOrManipulator)
    }
    this.multiplier = multiplier
    this.postMultiplication = postMultiplication
  }

  // uses UniversalExtractor and UniversalUpdater respectively.
  private static createCustomManipulator<V> (name: string): ValueManipulator<V, number> {
    return new CompositeUpdater(new UniversalExtractor(name), new UniversalUpdater(name))
  }

  returnOldValue (): this {
    this.postMultiplication = true
    return this
  }

  // Since we are using JSON format cannot use ReflectionExtractor and ReflectionUpdater
  // (which are used by PropertyManipulator). So we create a CompositeUpdater that

  returnNewValue (): this {
    this.postMultiplication = false
    return this
  }
}
