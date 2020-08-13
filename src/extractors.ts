/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ChainedExtractor, IdentityExtractor, MultiExtractor, UniversalExtractor, ValueExtractor } from './extractor'

/**
 * Simple Extractor DSL.
 *
 * @remarks
 * The methods in this class are for the most part simple factory methods for
 * various {@link ValueExtractor} classes, but in some cases provide additional type
 * safety. They also tend to make the code more readable, especially if imported
 * statically, so their use is strongly encouraged in lieu of direct construction
 * of {@link ValueExtractor} classes.
 */
export class Extractors {
  /**
   * Returns an extractor that extracts the specified fields or
   * extractors where extraction occurs in a chain where the result of each
   * field extraction is the input to the next extractor. The result
   * returned is the result of the final extractor in the chain.
   *
   * @typeParam T  the type of the object to extract from
   *
   * @param extractorsOrFields  If extractorsOrFields is a string type, then the
   *                            field names to extract (if any field name contains a dot '.'
   *                            that field name is split into multiple field names delimiting on
   *                            the dots. If extractorsOrFields is of ValueExtractor[] type,
   *                            then the {@link ValueExtractor}s are used to extract the values
   *
   * @return an extractor that extracts the value(s) of the specified field(s)
   */
  static chained<T, R> (extractorsOrFields: ValueExtractor<any, any>[] | string): ValueExtractor<T, R> {
    let extractors = new Array<ValueExtractor<T, R>>()

    if (extractorsOrFields && (typeof extractorsOrFields === 'string')) {
      const s = extractorsOrFields as string
      if (s.length > 0) {
        for (const fieldName of s.split('.')) {
          extractors.push(Extractors.extract<T, R>(fieldName))
        }
      }
    } else {
      extractors = extractorsOrFields as ValueExtractor<any, any>[]
    }

    if (extractors.length == 1) {
      return extractors[0]
    }
    return new ChainedExtractor<any, any>(extractors)
  }

  /**
   * Returns an extractor that extracts the value of the specified field.
   *
   * @typeParam T  the type of the object to extract from
   * @typeParam E  the type of the extracted value
   *
   * @param from    the name of the field or method to extract the value from.
   * @param params  the parameters to pass to the method.
   *
   * @return an extractor that extracts the value of the specified field.
   */
  static extract<T, E> (from: string, params?: any[]): ValueExtractor<T, E> {
    if (params) {
      if (!from.endsWith('()')) {
        from = from + '()'
      }
    }

    return new UniversalExtractor(from, params)
  }

  /**
   * Returns an extractor that always returns its input argument.
   *
   * @typeParam T  the type of the input and output objects to the function
   *
   * @return an extractor that always returns its input argument
   */
  static identity<T> (): ValueExtractor<T, T> {
    return IdentityExtractor.INSTANCE
  }

  /**
   * Returns an extractor that casts its input argument.
   *
   * @typeParam T  the type of the input objects to the function
   * @typeParam E  the type of the output objects to the function
   *
   * @return an extractor that always returns its input argument
   */
  static identityCast<T, E> (): ValueExtractor<T, E> {
    return IdentityExtractor.INSTANCE
  }

  /**
   * Returns an extractor that extracts the specified fields
   * and returns the extracted values in an array.
   *
   * @typeParam T the type of the object to extract from
   *
   * @param extractorOrFields  the field names to extract
   *
   * @return an extractor that extracts the value(s) of the specified field(s)
   */
  static multi<T> (extractorOrFields: ValueExtractor<T, any>[] | string): ValueExtractor<T, any[]> {
    let extractors: ValueExtractor<T, any>[] = new Array<ValueExtractor<T, any>>()
    if (typeof extractorOrFields[0] === 'string') {
      for (const f in extractorOrFields as String) {
        extractors.push(Extractors.chained(f))
      }
    } else {
      extractors = extractorOrFields as ValueExtractor<T, any>[]
    }

    return new MultiExtractor(extractors)
  }
}
