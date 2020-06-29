/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { BaseProcessor } from './base_processor'
import { PropertyManipulator } from './property_manipulator'
import { ValueManipulator } from './value_manipulator'

export abstract class PropertyProcessor<K, V, R>
  extends BaseProcessor<K, V, R> {
  /**
   * The property value manipulator.
   */
  manipulator: ValueManipulator<V, R>

  /**
   * Construct a PropertyProcessor for the specified property name.
   * <p>
   * This constructor assumes that the corresponding property getter will
   * have a name of ("get" + sName) and the corresponding property setter's
   * name will be ("set + sName).
   *
   * @param sName  a property name
   */
  protected constructor (typeName: string, manipulatorOrPropertyName: ValueManipulator<V, R> | string, useIs: boolean = false) {
    super(typeName)
    if (typeof manipulatorOrPropertyName === 'string') {
      this.manipulator = new PropertyManipulator(manipulatorOrPropertyName, useIs)
    } else {
      this.manipulator = manipulatorOrPropertyName
    }
  }
}
