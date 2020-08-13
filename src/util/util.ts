/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

/**
 * Utility class.
 */
export class Util {
  /**
   * Ensure the property is not `null` or `undefined` and if so, will throw a new
   * {@link Error} with the provided message as the cause.
   *
   * @param property  the property to test
   * @param message   the message to use when throwing an error
   */
  static ensureNotNull (property: any | undefined | null, message: string) {
    if (!property) {
      throw new Error(message)
    }
  }

  /**
   * Ensure the property is not a zero-length string and if so, will throw a new
   * {@link Error} with the provided message as the cause.
   *
   * @param property  the property to test
   * @param message   the message to use when throwing an error
   */
  static ensureNonEmptyString (property: string | null | undefined, message: string) {
    if (!property || property.trim().length == 0) {
      throw new Error(message)
    }
  }

  /**
   * Ensure the provided array is not empty and if it is, throw a new {@link Error} with the provided
   * message as the cause.
   *
   * @param arr      the array to test
   * @param message  the message to use when throwing an error.
   */
  static ensureNotEmpty (arr: any[] | undefined | null, message: string) {
    if (arr == null || arr.length == 0) {
      throw new Error(message)
    }
  }

  /**
   * Utility function for checking if an object is an Iterable.
   *
   * @param arg  the object to test
   */
  static isIterableType<T> (arg: any): arg is Iterable<T> {
    return arg && typeof arg[Symbol.iterator] === 'function'
  }
}
