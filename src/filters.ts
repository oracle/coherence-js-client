/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { extractor, Extractors } from './extractors'

export namespace filter {
  export abstract class Filter {
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
     * @param key  associated key
     *
     * @return a key associated filter
     */
    associatedWith<K = any> (key: K): KeyAssociatedFilter {
      return new KeyAssociatedFilter(this, key)
    }

    /**
     * Return a filter that will only be evaluated within specified key set.
     *
     * @param keys  the set of keys to limit the filter evaluation to
     *
     * @return a key set-limited filter
     */
    forKeys<K = any> (keys: Set<K>): InKeySetFilter<K> {
      return new InKeySetFilter<K>(this, keys)
    }
  }

  /**
   * Base Filter implementation for doing extractor-based processing.
   */
  export abstract class ExtractorFilter
    extends Filter {

    /**
     * The {@link extractor.ValueExtractor} used by this {@link Filter}.
     */
    protected extractor: extractor.ValueExtractor

    /**
     * Construct an `ExtractorFilter` for the given {@link extractor.ValueExtractor}.
     *
     * @param typeName           Server-side `Filter` implementation type identifier.
     * @param extractorOrMethod  the {@link extractor.ValueExtractor} to use by this {@link Filter} or a method name to
     *                           make a {@link UniversalExtractor} for; this parameter can also be a dot-delimited
     *                           sequence of method names which would result in an ExtractorFilter based on
     *                           the {@link ChainedExtractor} that is based on an array of corresponding
     *                           ReflectionExtractor objects
     */
    protected constructor (typeName: string, extractorOrMethod: extractor.ValueExtractor | string) {
      super(typeName)
      this.extractor = (extractorOrMethod instanceof extractor.ValueExtractor)
        ? extractorOrMethod
        : (extractorOrMethod.indexOf('.') < 0)
          ? new extractor.UniversalExtractor(extractorOrMethod)
          : new extractor.ChainedExtractor(extractorOrMethod)
    }
  }

  /**
   * Filter which compares the result of a method invocation with a value.
   *
   * @typeParam C  the type of value to compare extracted attribute with
   */
  export abstract class ComparisonFilter<C = any>
    extends ExtractorFilter {
    /**
     * The value to compare to.
     */
    protected value: C

    /**
     * Construct a `ComparisonFilter`.
     *
     * @param typeName           Server-side `Filter` implementation type identifier.
     * @param extractorOrMethod  the {@link extractor.ValueExtractor} to use by this {@link Filter} pr the name of the method
     *                           to invoke via reflection
     * @param value              the object to compare the result with
     */
    protected constructor (typeName: string, extractorOrMethod: extractor.ValueExtractor | string, value: C) {
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
      super(filterName('AnyFilter'), filters)
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
      super(filterName('AllFilter'), filters)
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
      this['@class'] = filterName('AndFilter')
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
      this['@class'] = filterName('OrFilter')
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
      super(filterName('XorFilter'), [left, right])
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
  export class InKeySetFilter<K = any>
    extends Filter {
    /**
     * The underlying set of keys.
     */
    keys: Set<K>
    /**
     * The underlying Filter.
     */
    protected filter: Filter

    /**
     * Construct an `InKeySetFilter` for testing "In" condition.
     *
     * @typeParam K   the key type
     *
     * @param filter  the underlying filter
     * @param keys    the set of keys to limit the filter evaluation to
     */
    constructor (filter: Filter, keys: Set<K>) {
      super('InKeySetFilter')
      this.filter = filter
      this.keys = keys
    }
  }

  /**
   * Filter which always evaluates to `true`.
   */
  export class AlwaysFilter
    extends Filter {
    /**
     * Singleton `AlwaysFilter` instance.
     */
    static readonly INSTANCE: AlwaysFilter = new AlwaysFilter()

    /**
     * Construct an AlwaysFilter.
     */
    protected constructor () {
      super(filterName('AlwaysFilter'))
    }
  }

  /**
   * Filter which compares the result of a method invocation with a value for
   * "Between" condition.  We use the standard ISO/IEC 9075:1992 semantic,
   * according to which "X between Y and Z" is equivalent to "X &gt;= Y &amp;&amp; X &lt;= Z".
   * In a case when either result of a method invocation or a value to compare
   * are equal to null, the <tt>evaluate</tt> test yields <tt>false</tt>.
   * This approach is equivalent to the way the NULL values are handled by SQL.
   */
  export class BetweenFilter
    extends AndFilter {

    /**
     * Lower bound of range.
     */
    protected from: number

    /**
     * Upper bound of range.
     */
    protected to: number

    /**
     * Construct a BetweenFilter for testing "Between" condition.
     *
     * @param extractorOrMethod  the {@link extractor.ValueExtractor} used by this filter or the name of the method to invoke
     *                           via reflection
     * @param from               the lower bound of the range
     * @param to                 the upper bound of the range
     * @param includeLowerBound  a flag indicating whether values matching the lower bound evaluate to true
     * @param includeUpperBound  a flag indicating whether values matching the upper bound evaluate to true
     */
    constructor (extractorOrMethod: extractor.ValueExtractor | string, from: number, to: number,
                 includeLowerBound: boolean = false, includeUpperBound: boolean = false) {
      super(includeLowerBound
        ? new GreaterEqualsFilter(extractorOrMethod, from)
        : new GreaterFilter(extractorOrMethod, from),
        includeUpperBound
          ? new LessEqualsFilter(extractorOrMethod, to)
          : new LessFilter(extractorOrMethod, to)
      )

      this['@class'] = filterName('BetweenFilter')
      this.from = from
      this.to = to
    }
  }

  /**
   * Filter which tests a Collection or array value returned from
   * a method invocation for containment of all values in a Set.
   */
  export class ContainsAllFilter
    extends ComparisonFilter<Set<any>> {

    /**
     * Construct an ContainsAllFilter for testing containment of the given Set
     * of values.
     *
     * @param extractorOrMethod  the {@link extractor.ValueExtractor} used by this filter or the name of the method to invoke
     *                           via reflection
     *
     * @param setValues the Set of values that a Collection or array is tested to contain
     */
    constructor (extractorOrMethod: extractor.ValueExtractor | string, setValues: Set<any>) {
      super(filterName('ContainsAllFilter'), extractorOrMethod, setValues)
    }
  }

  /**
   * Filter which tests Collection or Object array value returned from
   * a method invocation for containment of any value in a Set.
   */
  export class ContainsAnyFilter
    extends ComparisonFilter<Set<any>> {

    /**
     * Construct an ContainsAllFilter for testing containment of any value within the given Set.
     *
     * @param extractorOrMethod  the {@link extractor.ValueExtractor} used by this filter or the name of the method to invoke
     *                           via reflection
     *
     * @param setValues the Set of values that a Collection or array is tested to contain
     */
    constructor (extractorOrMethod: extractor.ValueExtractor | string, setValues: Set<any>) {
      super(filterName('ContainsAnyFilter'), extractorOrMethod, setValues)
    }
  }

  /**
   * Filter which tests a collection or array value returned from
   * a method invocation for containment of a given value.
   *
   * @typeParam E  the type of the extracted attribute to use for comparison
   */
  export class ContainsFilter<E = any>
    extends ComparisonFilter<E> {

    /**
     * Construct an ContainsFilter for testing containment of the given
     * object.
     *
     * @param extractorOrMethod  the {@link extractor.ValueExtractor} used by this filter or the name of the method to invoke
     *                           via reflection
     * @param value              the object that a collection or array is tested
     *                           to contain
     */
    constructor (extractorOrMethod: extractor.ValueExtractor | string, value: E) {
      super(filterName('ContainsFilter'), extractorOrMethod, value)
    }
  }

  /**
   * Filter which compares the result of a method invocation with a value for
   * equality.
   *
   * @typeParam E  the type of the value to use for comparison
   */
  export class EqualsFilter<E = any>
    extends ComparisonFilter<E> {

    /**
     * Construct an EqualsFilter for testing equality.
     *
     * @param extractorOrMethod  the extractor.ValueExtractor to use by this filter or the name of the method to invoke
     *                           via reflection
     * @param value              the object to compare the result with
     */
    constructor (extractorOrMethod: extractor.ValueExtractor | string, value: E) {
      super(filterName('EqualsFilter'), extractorOrMethod, value)
    }
  }

  /**
   * Filter which compares the result of a method invocation with a value for
   * `Greater or Equal` condition. In a case when either result of a method
   * invocation or a value to compare are equal to `null`, the evaluate
   * test yields false. This approach is equivalent to the way
   * the `NULL` values are handled by SQL.
   *
   * @typeParam E  the type of the value to use for comparison
   */
  export class GreaterEqualsFilter<E = any>
    extends ComparisonFilter<E> {

    /**
     * Construct a `GreaterEqualFilter` for testing `Greater or Equal`
     * condition.
     *
     * @param extractorOrMethod the extractor.ValueExtractor to use by this filter or
     *                          the name of the method to invoke via reflection
     * @param value             the object to compare the result with
     */
    constructor (extractorOrMethod: extractor.ValueExtractor | string, value: E) {
      super(filterName('GreaterEqualsFilter'), extractorOrMethod, value)
    }
  }

  /**
   * Filter which compares the result of a method invocation with a value for
   * `Greater` condition. In a case when either result of a method
   * invocation or a value to compare are equal to null, the evaluate
   * test yields `false`. This approach is equivalent to the way
   * the `NULL` values are handled by SQL.
   *
   * @typeParam E  the type of the value to use for comparison
   */
  export class GreaterFilter<E = any>
    extends ComparisonFilter<E> {
    /**
     * Construct a `GreaterFilter` for testing `Greater`
     * condition.
     *
     * @param extractorOrMethod the extractor.ValueExtractor to use by this filter or
     *                          the name of the method to invoke via reflection
     * @param value             the object to compare the result with
     */
    constructor (extractorOrMethod: extractor.ValueExtractor | string, value: E) {
      super(filterName('GreaterFilter'), extractorOrMethod, value)
    }
  }

  /**
   * Filter which checks whether the result of a method invocation belongs to a
   * predefined set of values.
   */
  export class InFilter<E = any>
    extends ComparisonFilter<Set<E>> {

    /**
     * Construct an InFilter for testing `In` condition.
     *
     * @param extractorOrMethod  the extractor.ValueExtractor to use by this filter or
     *                           the name of the method to invoke via reflection
     * @param setValues          the set of values to compare the result with
     */
    constructor (extractorOrMethod: extractor.ValueExtractor | string, setValues: Set<E>) {
      super(filterName('InFilter'), extractorOrMethod, setValues)
    }
  }

  /**
   * Filter which compares the result of a method invocation with a value for
   * inequality.
   *
   * @typeParam E the type of the value to use for comparison
   */
  export class NotEqualsFilter<E = any>
    extends ComparisonFilter<E> {
    /**
     * Construct a `NotEqualsFilter` for testing inequality.
     *
     * @param extractorOrMethod  the extractor.ValueExtractor to use by this filter or the name of the method to invoke via reflection
     * @param value              the object to compare the result with
     */
    constructor (extractorOrMethod: extractor.ValueExtractor | string, value: E) {
      super(filterName('NotEqualsFilter'), extractorOrMethod, value)
    }
  }

  /**
   * Filter which tests the result of a method invocation for inequality to `null`.
   */
  export class IsNotNullFilter
    extends NotEqualsFilter {
    /**
     * Construct a IsNotNullFilter for testing inequality to `null`.
     *
     * @param extractorOrMethod  the extractor.ValueExtractor to use by this filter or
     *                           the name of the method to invoke via reflection
     */
    constructor (extractorOrMethod: extractor.ValueExtractor | string) {
      super(extractorOrMethod, null)
      this['@class'] = filterName('IsNotNullFilter')
    }
  }

  /**
   * Filter which compares the result of a method invocation with null.
   *
   * @author cp/gg 2002.10.27
   */
  export class IsNullFilter
    extends EqualsFilter {
    /**
     * Construct a `IsNullFilter` for testing equality to `null`.
     *
     * @param extractorOrMethod the extractor.ValueExtractor to use by this filter or
     *                          the name of the method to invoke via reflection
     */
    constructor (extractorOrMethod: extractor.ValueExtractor | string) {
      // @ts-ignore
      super(extractorOrMethod, null)
      this['@class'] = filterName('IsNullFilter')
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
  export class KeyAssociatedFilter
    extends Filter {

    /**
     * The association host key.
     */
    hostKey: any
    /**
     * The underlying filter.
     */
    protected filter: Filter

    /**
     * Filter which limits the scope of another filter according to the key
     * association information.
     *
     * @param filter   the other filter whose scope to limit
     * @param hostKey  the `filter` argument will only be applied to
     *                 cache service nodes that contain this key.
     */
    constructor (filter: Filter, hostKey: any) {
      super(filterName('KeyAssociatedFilter'))
      this.filter = filter
      this.hostKey = hostKey
    }
  }

  /**
   * Filter which compares the result of a method invocation with a value for
   * `"`Less or Equals`"` condition. In a case when either result of a method
   * invocation or a value to compare are equal to null, the evaluate
   * test yields `false`. This approach is equivalent to the way
   * the `NULL` values are handled by SQL.
   *
   * @typeParam E  the type of value to use for comparison
   */
  export class LessEqualsFilter<E = any>
    extends ComparisonFilter<E> {
    /**
     * Construct a `LessEqualsFilter` for testing `Less or Equals` condition.
     *
     * @param extractor  the extractor.ValueExtractor to use by this filter or the name of the method to invoke via reflection
     * @param value      the object to compare the result with
     */
    constructor (extractor: extractor.ValueExtractor | string, value: E) {
      super(filterName('LessEqualsFilter'), extractor, value)
    }
  }

  /**
   * Filter which compares the result of a method invocation with a value for
   * `Less` condition. In a case when either result of a method
   * invocation or a value to compare are equal to `null`, the evaluate
   * test yields `false`. This approach is equivalent to the way
   * the `NULL` values are handled by SQL.
   *
   * @typeParam E the type of the value to use for comparison
   */
  export class LessFilter<E = any>
    extends ComparisonFilter<E> {
    /**
     * Construct a LessFilter for testing `Less` condition.
     *
     * @param extractorOrMethod the extractor.ValueExtractor to use by this filter or the name of the method
     *                          to invoke via reflection
     * @param value             the object to compare the result with
     */
    constructor (extractorOrMethod: extractor.ValueExtractor | string, value: E) {
      super(filterName('LessFilter'), extractorOrMethod, value)
    }
  }

  /**
   * Filter which compares the result of a method invocation with a value for
   * pattern match. A pattern can include regular characters and wildcard
   * characters `_` and `%`.
   *
   * During pattern matching, regular characters must exactly match the
   * characters in an evaluated string. Wildcard character `_` (underscore) can
   * be matched with any single character, and wildcard character `%` can be
   * matched with any string fragment of zero or more characters.
   */
  export class LikeFilter
    extends ComparisonFilter<string> {
    escapeChar: string
    ignoreCase: boolean

    /**
     * Construct a `LikeFilter` for pattern match.
     *
     * @param extractorOrMethod  the extractor.ValueExtractor to use by this filter or the name
     *                           of the method to invoke via reflection
     * @param pattern            the string pattern to compare the result with
     * @param escapeChar         the escape character for escaping `%` and `_`
     * @param ignoreCase         `true` to be case-insensitive
     */
    constructor (extractorOrMethod: extractor.ValueExtractor | string, pattern: string, escapeChar: string = '0', ignoreCase: boolean = false) {
      super(filterName('LikeFilter'), extractorOrMethod, pattern)

      this.escapeChar = escapeChar.length === 1 ? escapeChar : '0'
      this.ignoreCase = ignoreCase || false
    }
  }

  /**
   * Filter which evaluates the content of a MapEvent object according to the
   * specified criteria.  This filter is intended to be used by various
   * map listeners that are interested in particular subsets
   * of MapEvent notifications emitted by the map.
   */
  export class MapEventFilter<K, V>
    extends Filter {
    /**
     * This value indicates that insert events should be evaluated. The event will be fired if
     * there is no filter specified or the filter evaluates to true for a new
     * value.
     */
    static INSERTED = 0x0001

    /**
     * This value indicates that update events should be evaluated. The event will be fired if
     * there is no filter specified or the filter evaluates to true when applied to either
     * old or new value.
     */
    static UPDATED = 0x0002

    /**
     * This value indicates that delete events should be evaluated. The event will be fired if
     * there is no filter specified or the filter evaluates to true for an old value.
     */
    static DELETED = 0x0004

    /**
     * This value indicates that update events should be evaluated, but only if filter
     * evaluation is `false` for the old value and true for the new value. This corresponds to an item
     * that was not in a keySet filter result changing such that it would now
     * be in that keySet filter result.
     */
    static UPDATED_ENTERED = 0x0008

    /**
     * This value indicates that update events should be evaluated, but only if filter
     * evaluation is `true` for the old value and false for the new value. This corresponds to an item
     * that was in a keySet filter result changing such that it would no
     * longer be in that keySet filter result.
     */
    static UPDATED_LEFT = 0x0010

    /**
     * This value indicates that update events should be evaluated, but only if filter
     * evaluation is true for both the old and the new value. This corresponds to an item
     * that was in a keySet filter result changing but not leaving the keySet
     * filter result.
     */
    static UPDATED_WITHIN = 0x0020

    /**
     * This value indicates that all events should be evaluated.
     */
    static ALL = MapEventFilter.INSERTED | MapEventFilter.UPDATED |
      MapEventFilter.DELETED

    /**
     * This value indicates that all events that would affect the result of
     * a NamedMap.keySet(Filter) query should be evaluated.
     *
     * @since Coherence 3.1
     */
    static KEYSET = MapEventFilter.INSERTED | MapEventFilter.DELETED |
      MapEventFilter.UPDATED_ENTERED | MapEventFilter.UPDATED_LEFT

    /**
     * The event mask.
     */
    mask: number

    /**
     * The event value(s) filter.
     */
    filter?: Filter | undefined | null

    /**
     * Construct a MapEventFilter that evaluates MapEvent objects
     * based on the specified combination of event types.
     *
     * @param maskOrFilter  combination of any of the E_* values or the filter passed previously to a keySet() query method
     * @param filter        the filter used for evaluating event values
     */
    constructor (maskOrFilter: number | Filter, filter?: Filter) {
      super(filterName('MapEventFilter'))
      if (filter) {
        // Two arg invocation.
        this.mask = maskOrFilter as number
        this.filter = filter
      } else {
        // One arg invocation.
        if (maskOrFilter instanceof Filter) {
          this.mask = MapEventFilter.KEYSET
          this.filter = maskOrFilter
        } else {
          this.mask = maskOrFilter
          this.filter = null
        }
      }
    }
  }

  /**
   * Filter which always evaluates to `false`.
   */
  export class NeverFilter
    extends Filter {
    /**
     * Singleton `NeverFilter` instance.
     */
    static readonly INSTANCE: NeverFilter = new NeverFilter()

    /**
     * Construct a NeverFilter.
     */
    protected constructor () {
      super(filterName('NeverFilter'))
    }
  }

  /**
   * Filter which negates the results of another filter.
   */
  export class NotFilter
    extends Filter {

    /**
     * The Filter whose results are negated by this filter.
     */
    protected filter: Filter

    /**
     * Construct a negation filter.
     *
     * @param filter  the filter whose results this Filter negates
     */
    constructor (filter: Filter) {
      super(filterName('NotFilter'))
      this.filter = filter
    }
  }

  /**
   * A predicate based {@link ExtractorFilter}.
   */
  export class PredicateFilter
    extends ExtractorFilter {
    /**
     * The 'Predicate' for filtering extracted values.
     */
    predicate: { '@class': string }

    /**
     * Constructs a {@link PredicateFilter}.
     *
     * @param predicate          predicate for testing the value. The object must
     *                           have an '@class' attribute.
     * @param extractorOrMethod  the {@link extractor.ValueExtractor} used by this filter or the name of the method to invoke
     *                           via reflection
     */
    constructor (predicate: { '@class': string }, extractorOrMethod: extractor.ValueExtractor | string | undefined) {
      super(filterName('PredicateFilter'), extractorOrMethod || Extractors.identityCast())
      this.predicate = predicate
    }
  }

  /**
   * Filter which returns true for entries that currently exist in a map.
   *
   * This Filter is intended to be used solely in combination with a
   * {@link ConditionalProcessor} and is unnecessary
   * for standard {@link NamedMap} operations.
   */
  export class PresentFilter
    extends Filter {
    /**
     * Singleton `PresentFilter` instance
     */
    static readonly INSTANCE = new PresentFilter()

    /**
     * Construct a PresentFilter.
     */
    protected constructor () {
      super(filterName('PresentFilter'))
    }
  }

  /**
   * Filter which uses the regular expression pattern match defined by the
   * Java's `String.matches` contract. This implementation is not index
   * aware and will not take advantage of existing indexes.
   */
  export class RegexFilter
    extends ComparisonFilter<string> {
    /**
     *
     * @param extractorOrMethod  the {@link extractor.ValueExtractor} used by this filter or the name of the method to invoke
     *                           via reflection
     * @param regex              the regular expression to match the result with
     */
    constructor (extractorOrMethod: extractor.ValueExtractor | string, regex: string) {
      super(filterName('RegexFilter'), extractorOrMethod, regex)
    }
  }

  function filterName (name: string): string {
    return 'filter.' + name
  }
}

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
  static all (...filters: filter.Filter[]): filter.Filter {
    return new filter.AllFilter(filters)
  }

  /**
   * Return a filter that always evaluates to true.
   *
   * @return a filter that always evaluates to true.
   *
   * @link AlwaysFilter
   */
  static always (): filter.Filter {
    return filter.AlwaysFilter.INSTANCE
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
  static any (...filters: filter.Filter[]): filter.Filter {
    return new filter.AnyFilter(filters)
  }

  /**
   * Return a filter that tests if the extracted array contains the specified value.
   *
   * @param extractorOrMethod  the {@link extractor.ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param value              the object that a Collection or Object array is tested
   *                           to contain
   *
   * @return  a filter that tests if the extracted array contains the
   *          specified value
   */
  static arrayContains<E> (extractorOrMethod: extractor.ValueExtractor | string, value: E): filter.Filter {
    return new filter.ContainsFilter(extractorOrMethod, value)
  }

  /**
   * Return a filter that tests if the extracted array contains `all` of the specified values.
   *
   * @param extractorOrMethod  the {@link extractor.ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param values             the object that a Collection or Object array is tested
   *                           to contain
   *
   * @return  a filter that tests if the extracted array contains the
   *          specified values
   */
  static arrayContainsAll (extractorOrMethod: extractor.ValueExtractor | string, values: Set<any>): filter.Filter {
    return new filter.ContainsAllFilter(extractorOrMethod, values)
  }

  /**
   * Return a filter that tests if the extracted array contains `any` of the specified values.
   *
   * @param extractorOrMethod  the {@link extractor.ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param values             the object that a Collection or Object array is tested
   *                           to contain
   *
   * @return  a filter that tests if the extracted array contains the
   *          specified values
   */
  static arrayContainsAny (extractorOrMethod: extractor.ValueExtractor | string, values: Set<any>): filter.Filter {
    return new filter.ContainsAnyFilter(extractorOrMethod, values)
  }

  /**
   * Return a filter that tests if the extracted value is `between` the specified values (inclusive).
   *
   * @param extractorOrMethod  the {@link extractor.ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param from               the lower bound to compare the extracted value with
   * @param to                 the upper bound to compare the extracted value with
   * @param includeLowerBound  a flag indicating whether values matching the lower bound evaluate to `true`
   * @param includeUpperBound a flag indicating whether values matching the upper bound evaluate to `true`
   *
   * @return  a filter that tests if the extracted value is between the specified values
   */
  static between (extractorOrMethod: extractor.ValueExtractor | string, from: number, to: number,
                  includeLowerBound: boolean = true, includeUpperBound: boolean = true): filter.Filter {
    return new filter.BetweenFilter(extractorOrMethod, from, to, includeLowerBound, includeUpperBound)
  }

  /**
   * Return a filter that tests if the extracted collection contains the specified value.
   *
   * @param extractorOrMethod  the {@link extractor.ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param value              the object that a Collection or Object array is tested
   *                           to contain
   *
   * @return  a filter that tests if the extracted collection contains the
   *          specified value
   */
  static contains<E> (extractorOrMethod: extractor.ValueExtractor | string, value: E): filter.ContainsFilter {
    return new filter.ContainsFilter(extractorOrMethod, value)
  }

  /**
   * Return a filter that tests if the extracted collection contains `all` of the specified values.
   *
   * @param extractorOrMethod  the {@link extractor.ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param values             the object that a Collection or Object array is tested
   *                           to contain
   *
   * @return  a filter that tests if the extracted collection contains `all` of
   *          the specified values.
   */
  static containsAll (extractorOrMethod: extractor.ValueExtractor | string, values: Set<any>): filter.Filter {
    return new filter.ContainsAllFilter(extractorOrMethod, values)
  }

  /**
   * Return a filter that tests if the extracted collection contains `any` of the specified values.
   *
   * @param extractorOrMethod  the {@link extractor.ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param values             the object that a Collection or Object array is tested
   *                           to contain
   *
   * @return  a filter that tests if the extracted collection contains `any` of
   *          the specified values.
   */
  static containsAny (extractorOrMethod: extractor.ValueExtractor | string, values: Set<any>): filter.Filter {
    return new filter.ContainsAnyFilter(extractorOrMethod, values)
  }

  /**
   * Return a filter that tests for equality against the extracted value.
   *
   * @param extractorOrMethod  the {@link extractor.ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param value              the value to compare the extracted value with
   *
   * @return a filter that tests for equality
   */
  static equal<E = any> (extractorOrMethod: extractor.ValueExtractor | string, value: E): filter.EqualsFilter {
    return new filter.EqualsFilter(extractorOrMethod, value)
  }

  /**
   * Return a {@link MapEventFilter} using the provided filter and {@link MapEventFilter} mask.
   *
   * @param ff    the event filter
   * @param mask  the event mask
   */
  static event<K = any, V = any> (ff: filter.Filter, mask: number = filter.MapEventFilter.KEYSET): filter.MapEventFilter<K, V> {
    return new filter.MapEventFilter<K, K>(mask, ff)
  }

  /**
   * Return a filter that tests if the extracted value is greater than the
   * specified value.
   *
   * @param extractorOrMethod  the {@link extractor.ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param value              the value to compare the extracted value with
   *
   * @return  a filter that tests if the extracted value is greater than the
   *          specified value.
   */
  static greater<E = any> (extractorOrMethod: extractor.ValueExtractor | string, value: E): filter.GreaterFilter {
    return new filter.GreaterFilter(extractorOrMethod, value)
  }

  /**
   * Return a filter that tests if the extracted value is greater than or equal
   * to the specified value.
   *
   * @param extractorOrMethod  the {@link extractor.ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param value              the value to compare the extracted value with
   *
   * @return  a filter that tests if the extracted value is greater than or
   *          equal to the specified value.
   */
  static greaterEqual<E = any> (extractorOrMethod: extractor.ValueExtractor | string, value: E): filter.GreaterFilter {
    return new filter.GreaterEqualsFilter(extractorOrMethod, value)
  }

  /**
   * Return a filter that tests if the extracted value is contained in the
   * specified array.
   *
   * @param extractorOrMethod  the {@link extractor.ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param values             the values to compare the extracted value with
   *
   * @return  a filter that tests if the extracted value is contained in the
   *          specified array.
   *
   * @see ContainsAnyFilter
   */
  static in<E = any> (extractorOrMethod: extractor.ValueExtractor | string, values: Set<E>): filter.Filter {
    return new filter.InFilter(extractorOrMethod, values)
  }

  /**
   * Return a filter that evaluates to true for `non-null` values.
   *
   * @param extractorOrMethod  the {@link extractor.ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   *
   * @return a filter that evaluates to true for `non-null` values.
   */
  static isNotNull (extractorOrMethod: extractor.ValueExtractor | string): filter.IsNotNullFilter {
    return new filter.IsNotNullFilter(extractorOrMethod)
  }

  /**
   * Return a filter that evaluates to true for null values.
   *
   * @param extractorOrMethod  the {@link extractor.ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   *
   * @return a filter that evaluates to true for null values.
   */
  static isNull (extractorOrMethod: extractor.ValueExtractor | string): filter.IsNotNullFilter {
    return new filter.IsNullFilter(extractorOrMethod)
  }

  /**
   * Return a filter that tests if the extracted value is less than the
   * specified value.
   *
   * @param extractorOrMethod  the {@link extractor.ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param value              the value to compare the extracted value with
   *
   * @return  a filter that tests if the extracted value is less than the
   *          specified value
   */
  static less<E = any> (extractorOrMethod: extractor.ValueExtractor | string, value: E): filter.LessFilter {
    return new filter.LessFilter(extractorOrMethod, value)
  }

  /**
   * Return a filter that tests if the extracted value is less than or equal
   * to the specified value.
   *
   * @param extractorOrMethod  the {@link extractor.ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param value              the value to compare the extracted value with
   *
   * @return  a filter that tests if the extracted value is less than or equal
   *          to the specified value
   */
  static lessEqual<E = any> (extractorOrMethod: extractor.ValueExtractor | string, value: E): filter.Filter {
    return new filter.LessEqualsFilter(extractorOrMethod, value)
  }

  /**
   * Return a LikeFilter for pattern match.
   *
   * @param extractorOrMethod  the {@link extractor.ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param pattern            the string pattern to compare the result with
   * @param escape             the escape character for escaping '%' and '_'
   * @param ignoreCase         true to be case-insensitive
   *
   * @return a LikeFilter
   */
  static like (extractorOrMethod: extractor.ValueExtractor | string, pattern: string, escape: string, ignoreCase: boolean): filter.Filter {
    return new filter.LikeFilter(extractorOrMethod, pattern, escape, ignoreCase)
  }

  /**
   * Return a filter that always evaluates to `false`.
   *
   * @return a filter that always evaluates to `false`.
   */
  static never (): filter.Filter {
    return filter.NeverFilter.INSTANCE
  }

  /**
   * Return a filter that represents the logical negation of the specified
   * filter.
   *
   * @param ff     the filter.
   *
   * @return  a filter that represents the logical negation of the specified
   *          filter.
   */
  static not (ff: filter.Filter): filter.Filter {
    return new filter.NotFilter(ff)
  }

  /**
   * Return a filter that tests for non-equality.
   *
   * @param extractorOrMethod  the {@link extractor.ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param value              the value to compare the extracted value with
   *
   * @return a filter that tests for non-equality
   */
  static notEqual<E> (extractorOrMethod: extractor.ValueExtractor | string, value: E): filter.Filter {
    return new filter.NotEqualsFilter(extractorOrMethod, value)
  }

  /**
   * Return a filter that evaluates to `true` if an entry is present in the cache.
   *
   * @return a filter that evaluates to `true` if an entry is present
   *
   * @see PresentFilter
   */
  static present (): filter.Filter {
    return filter.PresentFilter.INSTANCE
  }

  /**
   * Return a RegexFilter for pattern match.
   *
   * @param extractorOrMethod  the {@link extractor.ValueExtractor} used by this filter or the name of the method to invoke
   *                           via reflection
   * @param regex              the Java regular expression to match the result with
   */
  static regex (extractorOrMethod: extractor.ValueExtractor | string, regex: string): filter.Filter {
    return new filter.RegexFilter(extractorOrMethod, regex)
  }
}
