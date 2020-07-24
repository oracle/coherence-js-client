/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

export class Util {

  static ensureNotNull (property: any | undefined | null, message: string) {
    if (!property) {
      throw new Error(message)
    }
  }

  static ensureNonEmptyString (property: string | null | undefined, message: string) {
    if (!property || property.trim().length == 0) {
      throw new Error(message)
    }
  }

  static ensureNotEmpty (arr: any[] | undefined | null, message: string) {
    if (arr == null || arr.length == 0) {
      throw new Error(message)
    }
  }

  static isIterableType<T> (arg: any): arg is Iterable<T> {
    return arg && typeof arg[Symbol.iterator] === 'function'
  }
}
