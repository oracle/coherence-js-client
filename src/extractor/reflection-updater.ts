/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { internal } from './package-internal'
import { ValueUpdater } from './value-updater'

/**
 * TODO(rlubke) docs, test
 */
export class ReflectionUpdater<T = any, E = any>
  extends ValueUpdater<T, E> {
  method: string

  /**
   * TODO(rlubke) docs
   * @param method a method or property method
   */
  constructor (method: string) {
    super(internal.extractorName('ReflectionUpdater'))
    this.method = method
  }
}
