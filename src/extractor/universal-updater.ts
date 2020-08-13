/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { internal } from './package-internal'
import { ValueUpdater } from './value-updater'

/**
 * Universal ValueUpdater implementation.
 *
 * Either a property-based and method-based {@link ValueUpdater}
 * based on whether constructor parameter *name* is evaluated to be a property or method.
 */
export class UniversalUpdater<T, E>
  extends ValueUpdater<T, E> {
  /**
   * The method or property name.
   */
  protected readonly name: string

  /**
   * Construct a UniversalUpdater for the provided name.
   * If <code>method</code> ends in a '()',
   * then the name is a method name. This implementation assumes that a
   * target's class will have one and only one method with the
   * specified name and this method will have exactly one parameter;
   * if the method is a property name, there should be a corresponding
   * JavaBean property modifier method or it will be used as a
   * key in a {@link Map}.
   *
   * @param method a method or property name
   */
  constructor (method: string) {
    super(internal.extractorName('UniversalUpdater'))
    this.name = method
  }
}
