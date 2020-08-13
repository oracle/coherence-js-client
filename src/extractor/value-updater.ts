/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

/**
 * ValueUpdater is used to update an object's state.
 *
 * @typeParam T  the type of object
 * @typeParam U  the type of value used to update the object
 */
export abstract class ValueUpdater<T, U> {
  /**
   * The server-side `ValueUpdater` type identifier.
   */
  protected readonly '@class': string

  /**
   * Constructs a new `ValueUpdater`.
   *
   * @param clz  the server-side `ValueUpdater` type identifier
   */
  protected constructor (clz: string) {
    this['@class'] = clz
  }
}
