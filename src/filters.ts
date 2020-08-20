/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ValueExtractor } from './extractor/'
import {
  AllFilter,
  AlwaysFilter,
  AnyFilter,
  BetweenFilter,
  ContainsAllFilter,
  ContainsAnyFilter,
  ContainsFilter,
  EqualsFilter,
  Filter,
  GreaterEqualsFilter,
  GreaterFilter,
  InFilter,
  IsNotNullFilter,
  IsNullFilter,
  LessEqualsFilter,
  LessFilter,
  LikeFilter,
  MapEventFilter,
  NeverFilter,
  NotEqualsFilter,
  NotFilter,
  PresentFilter,
  RegexFilter
} from './filter'


/**
 * Simple Filter DSL.
 *
 * @remarks
 * The methods in this class are simple factory methods for various
 * {@link Filter} classes. The use of these methods is strongly
 * encouraged in lieu of direct construction of {@link Filter} classes as
 * it makes the code more readable.
 */
export class Filters {

  /**
   * Return a composite filter representing logical `AND` of all specified
   * filters.
   *
   * @param filters  a variable number of filters
   *
   * @return  a composite filter representing logical `AND` of all specified
   *          filters
   */
  static all<T> (...filters: Filter<T>[]): Filter {
    return new AllFilter(filters)
  }

  /**
   * Return a filter that always evaluates to true.
   *
   * @return a filter that always evaluates to true.
   *
   * @link AlwaysFilter
   */
  static always<T> (): Filter<T> {
    return AlwaysFilter.INSTANCE
  }

  /**
   * Return a composite filter representing logical OR of all specified
   * filters.
   *
   * @param filters  an array of filters.
   *
   * @return  a composite filter representing logical OR of all specified
   *          filters
   *
   * @see AnyFilter
   */
  static any<T> (...filters: Filter<T>[]): Filter {
    return new AnyFilter(filters)
  }

  /**
   * Return a filter that tests if the extracted array contains the specified value.
   *
   * @typeParam T  the type of the input argument to the filter
   * @typeParam E  the type of the extracted attribute to use for comparison
   *
   * @param extractorOrMethod  the {@link ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param value              the object that a Collection or Object array is tested
   *                           to contain
   *
   * @return  a filter that tests if the extracted array contains the
   *          specified value
   */
  static arrayContains<T, E> (extractorOrMethod: ValueExtractor<T, E> | string, value: E): Filter<T> {
    return new ContainsFilter(extractorOrMethod, value)
  }

  /**
   * Return a filter that tests if the extracted array contains `all` of the specified values.
   *
   * @typeParam T  the type of the input argument to the filter
   * @typeParam E  the type of the extracted attribute to use for comparison
   *
   * @param extractorOrMethod  the {@link ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param values             the object that a Collection or Object array is tested
   *                           to contain
   *
   * @return  a filter that tests if the extracted array contains the
   *          specified values
   */
  static arrayContainsAll<T, E> (extractorOrMethod: ValueExtractor<T, E> | string, values: Set<any>): Filter<T> {
    return new ContainsAllFilter(extractorOrMethod, values)
  }

  /**
   * Return a filter that tests if the extracted array contains `any` of the specified values.
   *
   * @typeParam T  the type of the input argument to the filter
   * @typeParam E  the type of the extracted attribute to use for comparison
   *
   * @param extractorOrMethod  the {@link ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param values             the object that a Collection or Object array is tested
   *                           to contain
   *
   * @return  a filter that tests if the extracted array contains the
   *          specified values
   */
  static arrayContainsAny<T, E> (extractorOrMethod: ValueExtractor<T, E[]> | string, values: Set<any>): Filter<T> {
    return new ContainsAnyFilter(extractorOrMethod, values)
  }

  /**
   * Return a filter that tests if the extracted value is `between` the specified values (inclusive).
   *
   * @typeParam T  the type of the object to extract value from
   * @typeParam E  the type of extracted value
   *
   * @param extractorOrMethod  the {@link ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param from               the lower bound to compare the extracted value with
   * @param to                 the upper bound to compare the extracted value with
   * @param includeLowerBound  a flag indicating whether values matching the lower bound evaluate to `true`
   * @param includeUpperBound a flag indicating whether values matching the upper bound evaluate to `true`
   *
   * @return  a filter that tests if the extracted value is between the specified values
   */
  static between<T, E> (extractorOrMethod: ValueExtractor<T, E> | string, from: E, to: E,
                        includeLowerBound: boolean = true, includeUpperBound: boolean = true): Filter<T> {
    return new BetweenFilter(extractorOrMethod, from, to, includeLowerBound, includeUpperBound)
  }

  /**
   * Return a filter that tests if the extracted collection contains the specified value.
   *
   * @typeParam T  the type of the object to extract value from
   * @typeParam E  the type of extracted value
   *
   * @param extractorOrMethod  the {@link ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param value              the object that a Collection or Object array is tested
   *                           to contain
   *
   * @return  a filter that tests if the extracted collection contains the
   *          specified value
   */
  static contains<T, E> (extractorOrMethod: ValueExtractor<T, E> | string, value: E): ContainsFilter<T, E> {
    return new ContainsFilter(extractorOrMethod, value)
  }

  /**
   * Return a filter that tests if the extracted collection contains `all` of the specified values.
   *
   * @typeParam T  the type of the object to extract value from
   * @typeParam E  the type of extracted value
   *
   * @param extractorOrMethod  the {@link ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param values             the object that a Collection or Object array is tested
   *                           to contain
   *
   * @return  a filter that tests if the extracted collection contains `all` of
   *          the specified values.
   */
  static containsAll<T, E> (extractorOrMethod: ValueExtractor<T, E> | string, values: Set<any>): Filter<T> {
    return new ContainsAllFilter(extractorOrMethod, values)
  }

  /**
   * Return a filter that tests if the extracted collection contains `any` of the specified values.
   *
   * @typeParam T  the type of the object to extract value from
   * @typeParam E  the type of extracted value
   *
   * @param extractorOrMethod  the {@link ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param values             the object that a Collection or Object array is tested
   *                           to contain
   *
   * @return  a filter that tests if the extracted collection contains `any` of
   *          the specified values.
   */
  static containsAny<T, E> (extractorOrMethod: ValueExtractor<T, E> | string, values: Set<any>): Filter<T> {
    return new ContainsAnyFilter(extractorOrMethod, values)
  }

  /**
   * Return a filter that tests for equality against the extracted value.
   *
   * @typeParam T  the type of the object to extract value from
   * @typeParam E  the type of extracted value
   *
   * @param extractorOrMethod  the {@link ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param value              the value to compare the extracted value with
   *
   * @return a filter that tests for equality
   */
  static equal<T, E> (extractorOrMethod: ValueExtractor<T, E> | string, value: E): EqualsFilter<T, E> {
    return new EqualsFilter(extractorOrMethod, value)
  }

  /**
   * Return a {@link MapEventFilter} using the provided filter and {@link MapEventFilter} mask.
   *
   * @param filter  the event filter
   * @param mask    the event mask
   */
  static event<K, V> (filter: Filter<V>, mask: number = MapEventFilter.E_KEYSET): MapEventFilter<K, V> {
    return new MapEventFilter(mask, filter)
  }

  /**
   * Return a filter that tests if the extracted value is greater than the
   * specified value.
   *
   * @typeParam T  the type of the object to extract value from
   * @typeParam E  the type of extracted value
   *
   * @param extractorOrMethod  the {@link ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param value              the value to compare the extracted value with
   *
   * @return  a filter that tests if the extracted value is greater than the
   *          specified value.
   */
  static greater<T, E> (extractorOrMethod: ValueExtractor<T, E> | string, value: E): GreaterFilter<T, E> {
    return new GreaterFilter(extractorOrMethod, value)
  }

  /**
   * Return a filter that tests if the extracted value is greater than or equal
   * to the specified value.
   *
   * @typeParam T  the type of the object to extract value from
   * @typeParam E  the type of extracted value
   *
   * @param extractorOrMethod  the {@link ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param value              the value to compare the extracted value with
   *
   * @return  a filter that tests if the extracted value is greater than or
   *          equal to the specified value.
   */
  static greaterEqual<T, E> (extractorOrMethod: ValueExtractor<T, E> | string, value: E): GreaterFilter<T, E> {
    return new GreaterEqualsFilter(extractorOrMethod, value)
  }

  /**
   * Return a filter that tests if the extracted value is contained in the
   * specified array.
   *
   * @typeParam T  the type of the object to extract value from
   * @typeParam E  the type of extracted value
   *
   * @param extractorOrMethod  the {@link ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param values             the values to compare the extracted value with
   *
   * @return  a filter that tests if the extracted value is contained in the
   *          specified array.
   *
   * @see ContainsAnyFilter
   */
  static in<T, E> (extractorOrMethod: ValueExtractor<T, E> | string, values: Set<E>): Filter<T> {
    return new InFilter(extractorOrMethod, values)
  }

  /**
   * Return a filter that evaluates to true for `non-null` values.
   *
   * @typeParam T  the type of the object to extract value from
   * @typeParam E  the type of extracted value
   *
   * @param extractorOrMethod  the {@link ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   *
   * @return a filter that evaluates to true for `non-null` values.
   */
  static isNotNull<T, E> (extractorOrMethod: ValueExtractor<T, E> | string): IsNotNullFilter<T, E> {
    return new IsNotNullFilter(extractorOrMethod)
  }

  /**
   * Return a filter that evaluates to true for null values.
   *
   * @typeParam T  the type of the object to extract value from
   * @typeParam E  the type of extracted value
   *
   * @param extractorOrMethod  the {@link ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   *
   * @return a filter that evaluates to true for null values.
   */
  static isNull<T, E> (extractorOrMethod: ValueExtractor<T, E> | string): IsNotNullFilter<T, E> {
    return new IsNullFilter(extractorOrMethod)
  }

  /**
   * Return a filter that tests if the extracted value is less than the
   * specified value.
   *
   * @typeParam T  the type of the object to extract value from
   * @typeParam E  the type of extracted value
   *
   * @param extractorOrMethod  the {@link ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param value              the value to compare the extracted value with
   *
   * @return  a filter that tests if the extracted value is less than the
   *          specified value
   */
  static less<T, E> (extractorOrMethod: ValueExtractor<T, E> | string, value: E): LessFilter<T, E> {
    return new LessFilter(extractorOrMethod, value)
  }

  /**
   * Return a filter that tests if the extracted value is less than or equal
   * to the specified value.
   *
   * @typeParam T  the type of the object to extract value from
   * @typeParam E  the type of extracted value
   *
   * @param extractorOrMethod  the {@link ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param value              the value to compare the extracted value with
   *
   * @return  a filter that tests if the extracted value is less than or equal
   *          to the specified value
   */
  static lessEqual<T, E> (extractorOrMethod: ValueExtractor<T, E> | string, value: E): Filter<T> {
    return new LessEqualsFilter(extractorOrMethod, value)
  }

  /**
   * Return a LikeFilter for pattern match.
   *
   * @typeParam T  the type of the object to extract value from
   * @typeParam E  the type of extracted value
   *
   * @param extractorOrMethod  the {@link ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param pattern            the string pattern to compare the result with
   * @param escape             the escape character for escaping '%' and '_'
   * @param ignoreCase         true to be case-insensitive
   *
   * @return a LikeFilter
   */
  static like<T, E> (extractorOrMethod: ValueExtractor<T, E> | string, pattern: string, escape: string, ignoreCase: boolean): Filter<T> {
    return new LikeFilter(extractorOrMethod, pattern, escape, ignoreCase)
  }

  /**
   * Return a filter that always evaluates to `false`.
   *
   * @return a filter that always evaluates to `false`.
   */
  static never<T> (): Filter<T> {
    return NeverFilter.INSTANCE
  }

  /**
   * Return a filter that represents the logical negation of the specified
   * filter.
   *
   * @typeParam T     the type of the input argument to the filter
   *
   * @param filter    the filter.
   *
   * @return  a filter that represents the logical negation of the specified
   *          filter.
   */
  static not<T> (filter: Filter<T>): Filter<T> {
    return new NotFilter(filter)
  }

  /**
   * Return a filter that tests for non-equality.
   *
   * @typeParam T  the type of the object to extract value from
   * @typeParam E  the type of extracted value
   *
   * @param extractorOrMethod  the {@link ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param value              the value to compare the extracted value with
   *
   * @return a filter that tests for non-equality
   */
  static notEqual<T, E> (extractorOrMethod: ValueExtractor<T, E> | string, value: E): Filter<T> {
    return new NotEqualsFilter(extractorOrMethod, value)
  }

  /**
   * Return a filter that evaluates to `true` if an entry is present in the cache.
   *
   * @return a filter that evaluates to `true` if an entry is present
   *
   * @see PresentFilter
   */
  static present<T> (): Filter<T> {
    return PresentFilter.INSTANCE
  }

  /**
   * Return a RegexFilter for pattern match.
   *
   * @typeParam T  the type of the object to extract value from
   * @typeParam E  the type of extracted value
   *
   * @param extractorOrMethod  the {@link ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param regex              the Java regular expression to match the result with
   */
  static regex<T, E> (extractorOrMethod: ValueExtractor<T, E> | string, regex: string): Filter<T> {
    return new RegexFilter(extractorOrMethod, regex)
  }
}
