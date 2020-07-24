/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { Util } from './util'
import { ChainedExtractor, IdentityExtractor, MultiExtractor, UniversalExtractor, ValueExtractor} from './extractor'

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
   * @param extractorsOrFields  If extractorsOrFields is a string[] type, then the
   *                field names to extract (if any field name contains a dot '.'
   *                that field name is split into multiple field names delimiting on
   *                the dots. If extractorsOrFields is of ValueExtractor[] type,
   *                then the {@link ValueExtractor}s are used to extract the values.
   *
   * @param <T> the type of the object to extract from
   *
   * @return an extractor that extracts the value(s) of the specified field(s)
   *
   * @throws IllegalArgumentException if the fields parameter is null or an
   *         empty array
   *
   * @see UniversalExtractor
   */
  static chained<T, R> (...extractors: ValueExtractor<any, any>[]): ValueExtractor<T, R>;
  static chained<T, R> (...fields: string[]): ValueExtractor<T, R>;
  static chained<T, R> (...extractorsOrFields: ValueExtractor<any, any>[] | string[]): ValueExtractor<T, R> {
    let extractors = new Array<ValueExtractor<T, R>>()
    Util.ensureNotEmpty(extractorsOrFields, 'The extractors or fields parameter cannot be null or empty')

    if (extractorsOrFields && (typeof extractorsOrFields[0] === 'string')) {
      for (const e of (extractorsOrFields as string[])) {
        if (e && e.length > 0) {
          for (const fieldName of e.split('.')) {
            extractors.push(Extractors.extract<T, R>(fieldName))
          }
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
   * @param from    the name of the field or method to extract the value from.
   * @param params  the parameters to pass to the method.
   * @param <T>     the type of the object to extract from.
   * @param <E>     the type of the extracted value.
   *
   * @return an extractor that extracts the value of the specified field.
   *
   * @see UniversalExtractor
   */
  static extract<T, E> (from: string, params?: any[]): ValueExtractor<T, E> {
    if (params) {
      if (!from.endsWith('()')) {
        from = from + '()'
      }
    }

    // return new UniversalExtractor(from, params);
    return new UniversalExtractor(from, params)
  }

  /**
   * Returns an extractor that always returns its input argument.
   *
   * @param <T> the type of the input and output objects to the function
   *
   * @return an extractor that always returns its input argument
   */
  static identity<T> (): ValueExtractor<T, T> {
    return new IdentityExtractor<T>()
  }

  /**
   * Returns an extractor that casts its input argument.
   *
   * @param <T> the type of the input objects to the function
   * @param <E> the type of the output objects to the function
   *
   * @return an extractor that always returns its input argument
   */
  static identityCast<T, E> (): ValueExtractor<T, E> {
    return IdentityExtractor.INSTANCE
  }

  // static multi<T> (...fields: string[]): ValueExtractor;
  // static multi<T> (...extractors: ValueExtractor[]): ValueExtractor;
  // static multi<T> (...fieldsOrExtractors: ValueExtractor[] | string[]): ValueExtractor {
  //   Util.ensureNotEmpty(fieldsOrExtractors, 'fields or extractors array must not be null or empty')
  //   let extractors: ValueExtractor[] = new Array<ValueExtractor>()
  //   if (typeof fieldsOrExtractors[0] === 'string') {
  //     for (const f in fieldsOrExtractors) {
  //       extractors.push(Extractors.chained(f))
  //     }
  //   } else {
  //     extractors = fieldsOrExtractors as ValueExtractor[]
  //   }
  //
  //   return new MultiExtractor('', extractors) // ??
  // }

  private static isValueExtractor (e: any): e is ValueExtractor<any, any> {
    return (e as ValueExtractor<any, any>).getTarget !== undefined
  }
}
