/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ChainedExtractor, UniversalExtractor, ValueExtractor } from '../extractor/'
import { KeyAssociatedFilter } from '../filter/'
import { internal } from './package-internal'

export abstract class Filter<T = any> {
  /**
   * Server-side `Filter` implementation type identifier.
   */
  '@class': string

  /**
   * Constructs a new `Filter`.
   *
   * @param clz  server-side `Filter` implementation type identifier
   */
  protected constructor (clz: string) {
    this['@class'] = clz
  }

  /**
   * Return a composed filter that represents a short-circuiting logical
   * `AND` of this filter and another.  When evaluating the composed
   * filter, if this filter is `false, then the *other*
   * filter is not evaluated.
   * <p>
   * Any exceptions thrown during evaluation of either filter are
   * relayed to the caller; if evaluation of this filter throws an
   * exception, the *other* filter will not be evaluated.
   *
   * @param other  a filter that will be logically-`AND`ed with this filter
   *
   * @return a composed filter that represents the short-circuiting logical
   *         `AND` of this filter and the *other* filter
   */
  and (other: Filter): Filter {
    return new AndFilter(this, other)
  }

  /**
   * Return a composed predicate that represents a short-circuiting logical
   * `OR` of this predicate and another.  When evaluating the composed
   * predicate, if this predicate is `true`, then the *other*
   * predicate is not evaluated.
   * <p>
   * Any exceptions thrown during evaluation of either predicate are
   * relayed to the caller; if evaluation of this predicate throws an
   * exception, the *other* predicate will not be evaluated.
   *
   * @param other a predicate that will be logically-`OR`ed with this predicate
   *
   * @return a composed predicate that represents the short-circuiting logical
   *         `OR` of this predicate and the *other* predicate
   */
  or (other: Filter): Filter {
    return new OrFilter(this, other)
  }

  /**
   * Return a composed predicate that represents a logical `XOR` of this
   * predicate and another.
   *
   * Any exceptions thrown during evaluation of either predicate are
   * relayed to the caller; if evaluation of this predicate throws an
   * exception, the *other* predicate will not be evaluated.
   *
   * @param other a predicate that will be logically-`XOR`ed with this predicate
   *
   * @return a composed predicate that represents the logical `XOR` of this
   *         predicate and the 'other' predicate
   */
  xor (other: Filter): Filter {
    return new XorFilter(this, other)
  }

  /**
   * Return a key associated filter based on this filter and a specified key.
   *
   * @typeParam K  the key type
   *
   * @param key  associated key
   *
   * @return a key associated filter
   */
  associatedWith<K> (key: K): KeyAssociatedFilter<T> {
    return new KeyAssociatedFilter(this, key)
  }

  /**
   * Return a filter that will only be evaluated within specified key set.
   *
   * @typeParam K  the key type
   *
   * @param keys  the set of keys to limit the filter evaluation to
   *
   * @return a key set-limited filter
   */
  forKeys<K> (keys: Set<K>) {
    return new InKeySetFilter(this, keys)
  }
}

/**
 * Base Filter implementation for doing extractor-based processing.
 *
 * @typeParam T  the type of the input argument to the filter
 * @typeParam E  the type of the attribute extracted from the input argument
 */
export abstract class ExtractorFilter<T, E>
  extends Filter<T> {

  /**
   * The {@link ValueExtractor} used by this {@link Filter}.
   */
  protected extractor: ValueExtractor<T, E>

  /**
   * Construct an `ExtractorFilter` for the given {@link ValueExtractor}.
   *
   * @param typeName           Server-side `Filter` implementation type identifier.
   * @param extractorOrMethod  the {@link ValueExtractor} to use by this {@link Filter} or a method name to
   *                           make a {@link UniversalExtractor} for; this parameter can also be a dot-delimited
   *                           sequence of method names which would result in an ExtractorFilter based on
   *                           the {@link ChainedExtractor} that is based on an array of corresponding
   *                           ReflectionExtractor objects
   */
  protected constructor (typeName: string, extractorOrMethod: ValueExtractor<T, E> | string) {
    super(typeName)
    this.extractor = (extractorOrMethod instanceof ValueExtractor)
      ? extractorOrMethod
      : (extractorOrMethod.indexOf('.') < 0)
        ? new UniversalExtractor(extractorOrMethod)
        : new ChainedExtractor(extractorOrMethod)
  }
}

/**
 * Filter which compares the result of a method invocation with a value.
 *
 * @typeParam T  the type of the input argument to the filter
 * @typeParam E  the type of the extracted attribute to use for comparison
 * @typeParam C  the type of value to compare extracted attribute with
 */
export abstract class ComparisonFilter<T, E, C>
  extends ExtractorFilter<T, E> {
  /**
   * The value to compare to.
   */
  protected value: C

  /**
   * Construct a `ComparisonFilter`.
   *
   * @param typeName           Server-side `Filter` implementation type identifier.
   * @param extractorOrMethod  the {@link ValueExtractor} to use by this {@link Filter} pr the name of the method
   *                           to invoke via reflection
   * @param value              the object to compare the result with
   */
  protected constructor (typeName: string, extractorOrMethod: ValueExtractor<T, E> | string, value: C) {
    super(typeName, extractorOrMethod)
    this.value = value instanceof Set ? Array.from(value as Set<any>) as unknown as C : value
  }
}

/**
 * Filter which is a logical operator of a filter array.
 */
export abstract class ArrayFilter
  extends Filter {

  /**
   * The {@link Filter} array
   */
  protected filters: Filter[]

  /**
   * Construct a logical filter that applies a binary operator to a
   * filter array. The result is defined as:
   *
   * ```
   *   filter[0] <op> filter[1] ... <op> filter[n]
   * ```
   *
   * @param clz      Server-side `Filter` implementation type identifier.
   * @param filters  the filter array
   */
  protected constructor (clz: string, filters: Filter[]) {
    super(clz)
    this.filters = filters
  }
}

/**
 * Filter which returns the logical `OR` of a filter array.
 */
export class AnyFilter
  extends ArrayFilter {

  /**
   * Construct an "any" filter. The result is defined as:
   *
   * ```
   *   filter[0] || filter[1] ... || filter[n]
   * ```
   *
   * @param filters  the filter array
   */
  constructor (filters: Filter[]) {
    super(internal.filterName('AnyFilter'), filters)
  }
}

/**
 * Filter which returns the logical `AND`` of a filter array.
 */
export class AllFilter
  extends ArrayFilter {

  /**
   * Construct an `all` filter. The result is defined as:
   * ```
   *   filter[0] && filter[1] ... && filter[n]
   * ```
   *
   * @param filters   an array of filters
   */
  constructor (filters: Filter[]) {
    super(internal.filterName('AllFilter'), filters)
  }
}

/**
 * Filter which returns the logical `AND of two other filters.
 */
export class AndFilter
  extends AllFilter {
  /**
   * Construct an `AND` filter. The result is defined as:
   * ```
   *   filterLeft && filterRight
   * ```
   *
   * @param left   the "left" filter
   * @param right  the "right" filter
   */
  constructor (left: Filter, right: Filter) {
    super([left, right])
    this['@class'] = internal.filterName('AndFilter')
  }
}

/**
 * Filter which returns the logical `OR` of two other filters.
 */
export class OrFilter
  extends AnyFilter {
  /**
   * Construct an `OR` filter. The result is defined as:
   * ```
   *   filterLeft || filterRight
   * ```
   *
   * @param left   the "left" filter
   * @param right  the "right" filter
   */
  constructor (left: Filter, right: Filter) {
    super([left, right])
    this['@class'] = internal.filterName('OrFilter')
  }
}

/**
 * Filter which returns the logical exclusive or `XOR` of two other filters.
 */
export class XorFilter
  extends ArrayFilter {
  /**
   * Construct a "xor" filter. The result is defined as:
   * ```
   *   filterLeft ^ filterRight
   * ```
   *
   * @param left   the "left" filter
   * @param right  the "right" filter
   */
  constructor (left: Filter, right: Filter) {
    super(internal.filterName('XorFilter'), [left, right])
  }
}

/**
 * Filter which limits the scope of another filter according to the key
 * association information.
 *
 * @remarks
 * *Note 1:* This filter must be the outermost filter and cannot be used
 * as a part of any composite filter (AndFilter, OrFilter, etc.)
 * *Note 2:* This filter is intended to be processed only on the client
 * side of the partitioned cache service.
 *
 * Example:
 * ```ts
 * var filter = Filter.less('age', 40).associatedWith(10);
 * map.values(filter).then(values => {
 *   for (const entry of values) {
 *     console.log(JSON.stringify(entry, null, 4));
 *   }
 * });
 * ```
 */
export class InKeySetFilter<T, K>
  extends Filter<T> {
  /**
   * The underlying Filter.
   */
  protected filter: Filter<T>

  /**
   * The underlying set of keys.
   */
  keys: Set<K>

  /**
   * Construct an `InKeySetFilter` for testing "In" condition.
   *
   * @typeParam K   the key type
   * @param filter  the underlying filter
   * @param keys    the set of keys to limit the filter evaluation to
   */
  constructor (filter: Filter<T>, keys: Set<K>) {
    super('InKeySetFilter')
    this.filter = filter
    this.keys = keys
  }
}
