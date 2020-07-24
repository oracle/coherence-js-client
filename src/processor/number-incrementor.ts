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
 * NumberIncrementor entry processor.
 *
 * @param <K> the type of the Map entry key
 * @param <V> the type of the Map entry value
 */
export class NumberIncrementor<K = any, V = any>
  extends PropertyProcessor<K, V, number> {
  /**
   The number to multiply by.
   */
  increment: number

  /**
   * Whether to return the value before it was multiplied ("post-factor") or
   * after it is multiplied ("pre-factor").
   */
  postIncrement: boolean

  /**
   * Construct a NumberIncrementor EntryProcessor.
   *
   * @param nameOrManipulator
   * @param increment
   * @param postIncrement
   */
  constructor (nameOrManipulator: ValueManipulator<V, number> | string, increment: number, postIncrement: boolean = false) {
    super(internal.processorName('NumberIncrementor'),
      typeof nameOrManipulator === 'string'
        ? NumberIncrementor.createCustomManipulator<V>(nameOrManipulator)
        : nameOrManipulator)

    this.increment = increment
    this.postIncrement = postIncrement
  }

  // uses UniversalExtractor and UniversalUpdater respectively.
  private static createCustomManipulator<V> (name: string): ValueManipulator<V, number> {
    return new CompositeUpdater(new UniversalExtractor(name), new UniversalUpdater(name))
  }

  // TODO(rlubke) test
  returnOldValue (): this {
    this.postIncrement = true
    return this
  }

  // Since we are using JSON format cannot use ReflectionExtractor and ReflectionUpdater
  // (which are used by PropertyManipulator). So we create a CompositeUpdater that

  returnNewValue (): this {
    this.postIncrement = false
    return this
  }
}
