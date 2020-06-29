/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

export class Util {
  static EXTRACTOR_PACKAGE = 'extractor.'

  static FILTER_PACKAGE = 'filter.'

  static PROCESSOR_PACKAGE = 'processor.'

  static AGGREGATOR_PACKAGE = 'aggregator.'

  static BEAN_ACCESSOR_PREFIXES: string[] = ['get', 'set']

  static METHOD_SUFFIX: string = '()'

  static JSON_FORMAT: string = 'json'

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

  static ensureValidMethodSuffix (name: string) {
    if (!name.endsWith(this.METHOD_SUFFIX)) {
      const message = 'UniversalExtractor constructor: parameter sName[value:' + name + '] must end with ' +
        'method suffix \'' + Util.METHOD_SUFFIX + '\' when optional parameters provided'
      throw new Error(message)
    }
  }

  static toFilterName (name: string): string {
    return this.FILTER_PACKAGE + name
  }

  static toAggregatorName (name: string): string {
    return this.AGGREGATOR_PACKAGE + name
  }

  static toExtractorName (name: string): string {
    return this.EXTRACTOR_PACKAGE + name
  }

  static isIterableType<T> (arg: any): arg is Iterable<T> {
    return arg && typeof arg[Symbol.iterator] === 'function'
  }
}
