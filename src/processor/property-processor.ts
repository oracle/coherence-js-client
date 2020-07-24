/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { EntryProcessor, PropertyManipulator, ValueManipulator } from '.'

export abstract class PropertyProcessor<K, V, R>
  extends EntryProcessor<K, V, R> {
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
    this.manipulator = typeof manipulatorOrPropertyName === 'string'
      ? new PropertyManipulator(manipulatorOrPropertyName, useIs)
      : manipulatorOrPropertyName
  }
}
