/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { util } from './util'

export namespace extractor {
  /**
   * This enum describes the possible extraction targets when working with a map entry.
   */
  export enum Target {
    /**
     * Indicates that the extraction operation should use the entry's value.
     */
    VALUE = 0,

    /**
     * Indicates that the extraction operation should use the entry's key.
     */
    KEY = 1
  }

  /**
   * ValueExtractor is used to both extract values (for example, for sorting
   * or filtering) from an object, and to provide an identity for that extraction.
   *
   * @typeParam T  the type of the value to extract from
   * @typeParam E  the type of value that will be extracted
   */
  export abstract class ValueExtractor<T, E> {
    /**
     * Server-side ValueExtractor implementation type identifier.
     */
    protected '@class': string

    /**
     * Construct a ValueExtractor.
     *
     * @param clz     server-side ValueExtractor implementation type identifier
     * @param target  the extraction target
     */
    protected constructor (clz: string, target: Target = Target.VALUE) {
      this['@class'] = clz
      this._target = target
    }

    /**
     * The extraction target.
     */
    protected _target: Target

    /**
     * Return the extraction target.
     *
     * @return the extraction target
     */
    get target (): Target {
      return this._target
    }

    /**
     * Set the extraction target.
     *
     * @param target
     */
    set target (target: Target) {
      this._target = target
    }

    /**
     * Returns a composed extractor that first applies the *before*
     * extractor to its input, and then applies this extractor to the result.
     * If evaluation of either extractor throws an exception, it is relayed
     * to the caller of the composed extractor.
     *
     * @typeParam V  the type of input to the `before` extractor, and
     *               to the composed extractor
     * @typeParam E  the type of value that will be extracted
     *
     * @param before  the extractor to apply before this extractor is applied
     *
     * @return a composed extractor that first applies the *before*
     *         extractor and then applies this extractor
     */
    compose<V> (before: ValueExtractor<T, E>): ValueExtractor<V, E> {
      util.ensureNotNull(before, 'before cannot be null')

      return (before instanceof ChainedExtractor)
        ? before.andThen(this)
        : new ChainedExtractor<V, E>([before, this])
    }

    /**
     * Returns a composed extractor that first applies this extractor to its
     * input, and then applies the *after* extractor to the result. If
     * evaluation of either extractor throws an exception, it is relayed to
     * the caller of the composed extractor.
     *
     * @typeParam E  the type of value that will be extracted
     * @typeParam T  the type of the value to extract from
     * @typeParam V  the type of output of the `after` extractor, and of
     *               the composed extractor
     *
     * @param after   the extractor to apply after this extractor is applied
     *
     * @return a composed extractor that first applies this extractor and then
     *         applies the *after* extractor
     */
    andThen<V> (after: ValueExtractor<T, V>): ValueExtractor<E, V> {
      util.ensureNotNull(after, 'before cannot be null')

      return (!(after instanceof ChainedExtractor))
        ? after.compose(this)
        : new ChainedExtractor<T, V>([this, after])
    }
  }

  /**
   * Abstract super class for {@link ValueExtractor} implementations that are based on
   * an underlying array of {@link ValueExtractor} objects.
   *
   * @typeParam T  the type of the value to extract from
   * @typeParam E  the type of value that will be extracted
   */
  export class AbstractCompositeExtractor<T, E>
    extends ValueExtractor<T, T> {
    extractors: ValueExtractor<T, E>[]

    /**
     * Constructs a new AbstractCompositeExtractor.
     *
     * @param typeName    the server-side ValueExtractor implementation type identifier.
     * @param extractors  an array of extractors
     */
    protected constructor (typeName: string, extractors: ValueExtractor<T, E>[]) {
      super(typeName)
      this.extractors = extractors
    }
  }

  /**
   * Universal ValueExtractor implementation.
   * <p>
   * Either a property or method based extractor based on parameters passed to
   * constructor.
   * Generally, the name value passed to the `UniversalExtractor` constructor
   * represents a property unless the *name* value ends in `()`,
   * then this instance is a reflection based method extractor.
   * Special cases are described in the constructor documentation.
   * <p>
   *
   * @typeParam T  the type of the value to extract from
   * @typeParam E  the type of value that will be extracted
   */
  export class UniversalExtractor<T = any, E = any>
    extends ValueExtractor<T, E> {

    /**
     * A method or property name.
     */
    protected name: string

    /**
     * The parameter array. Must be `null` or `zero length` for a property based extractor.
     */
    protected params?: any[]

    /**
     * Construct a UniversalExtractor based on a name, optional
     * parameters and the entry extraction target.
     *
     * If *name* does not end in `()`, this extractor is a property extractor.
     * If `name` is prefixed with one of `set` or `get` and ends in `()`,
     * this extractor is a property extractor. If the *name*
     * just ends in `()`, this extractor is considered a method extractor.
     *
     * @param name    a method or property name
     * @param params  the array of arguments to be used in the method
     *                invocation; may be `null`
     * @param target  one of the {@link #VALUE} or {@link #KEY} values
     */
    constructor (name: string, params?: any[], target?: Target) {
      super(extractorName('UniversalExtractor'), target)
      this.name = name
      if (params) {
        this.params = params
      }
    }
  }

  /**
   * Composite {@link ValueExtractor} implementation based on an array of extractors.
   * The extractors in the array are applied sequentially left-to-right, so a
   * result of a previous extractor serves as a target object for a next one.
   *
   * @typeParam T  the type of the value to extract from
   * @typeParam E  the type of value that will be extracted
   */
  export class ChainedExtractor<T, E>
    extends AbstractCompositeExtractor<T, E> {

    /**
     * Create a new `ChainedExtractor`.
     *
     * @param extractorsOrMethod  an array of {@link ValueExtractor}s, or a dot-delimited sequence of method
     *                            names which results in a ChainedExtractor that is based on an array of
     *                            corresponding {@link UniversalExtractor} objects
     */
    constructor (extractorsOrMethod: ValueExtractor<T, E>[] | string) {
      super(extractorName('ChainedExtractor'),
        ((typeof extractorsOrMethod === 'string')
          ? ChainedExtractor.createExtractors(extractorsOrMethod)
          : extractorsOrMethod))
      this.target = this.computeTarget()
    }

    /**
     * Create a new `ChainedExtractor` based on the provided dot-delimited sequence of method names.
     *
     * @typeParam T  the type of the value to extract from
     * @typeParam E  the type of value that will be extracted
     *
     * @param fields  a dot-delimited sequence of method names
     *
     * @return an array of {@link ValueExtractor}s based on the input string
     */
    protected static createExtractors<T, E> (fields: string): ValueExtractor<T, E>[] {
      const names = fields.split('.').filter(f => f != null && f.length > 0)
      const arr = new Array<ValueExtractor<T, E>>()
      for (const name of names) {
        arr.concat(new UniversalExtractor(name))
      }

      return arr
    }

    /**
     * Return the target of the first extractor in a composite extractor.
     *
     * @return the target of the first extractor in a composite extractor
     */
    protected computeTarget (): Target {
      const aExtractor = this.extractors

      let result = Target.VALUE
      if (aExtractor != null && aExtractor.length > 0) {
        const extType: string = typeof aExtractor[0]
        if (extType === 'AbstractExtractor') {
          result = aExtractor[0].target
        }
      }
      return result
    }
  }

  /**
   * A Trivial {@link ValueExtractor} implementation that does not actually extract
   * anything from the passed value, but returns the value itself.
   */
  export class IdentityExtractor<T>
    extends ValueExtractor<T, T> {
    public static INSTANCE = new IdentityExtractor()

    /**
     * Constructs a new `IdentityExtractor` instance.
     */
    protected constructor () {
      super(extractorName('IdentityExtractor'))
    }
  }


  /**
   * Composite ValueExtractor implementation based on an array of extractors.
   * All extractors in the array are applied to the same target object and the
   * result of the extraction is a array of extracted values.
   *
   * Common scenarios for using the MultiExtractor involve the
   * `DistinctValuesAggregator` or `GroupAggregator` aggregators that allow clients
   * to collect all distinct combinations of a given set of attributes or collect
   * and run additional aggregation against the corresponding groups of entries.
   */
  export class MultiExtractor
    extends AbstractCompositeExtractor<any, any> {
    /**
     * Constructs a new `MultiExtractor`.
     *
     * @param extractorsOrMethod  an array of {@link ValueExtractor}s or a comma-delimited
     *                            of method names which results in a MultiExtractor that
     *                            is based on a corresponding array of {@link ValueExtractor} objects
     */
    constructor (extractorsOrMethod: ValueExtractor<any, any>[] | string) {
      super(extractorName('MultiExtractor'),
        ((typeof extractorsOrMethod === 'string')
          ? MultiExtractor.createExtractors(extractorsOrMethod)
          : extractorsOrMethod))
    }

    /**
     * Parse a comma-delimited sequence of method names and instantiate
     * a corresponding array of {@link ValueExtractor} objects.
     *
     * @param methods  a comma-delimited sequence of method names
     *
     * @return an array of {@link ValueExtractor} objects
     */
    protected static createExtractors (methods: string): ValueExtractor<any, any>[] {
      const names = methods.split(',').filter(f => f != null && f.length > 0)
      const arr = new Array<ValueExtractor<any, any>>()
      for (const name of names) {
        arr.concat(name.indexOf('.') < 0 ? new UniversalExtractor(name) : new ChainedExtractor(name))
      }

      return arr
    }
  }


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

  /**
   * ValueManipulator represents a composition of {@link ValueExtractor} and
   * {@link ValueUpdater} implementations.
   *
   * @typeParam  T  the type of object
   * @typeParam  V  the type of value that will be extracted/updated from/on object
   */
  export interface ValueManipulator<T, V> {

    /**
     * Retrieve the underlying ValueExtractor reference.
     *
     * @return the ValueExtractor
     */
    getExtractor (): ValueExtractor<T, V>;

    /**
     * Retrieve the underlying ValueUpdater reference.
     *
     * @return the ValueUpdater
     */
    getUpdater (): ValueUpdater<T, V>;
  }

  /**
   * A ValueUpdater implementation based on an extractor-updater pair that could
   * also be used as a ValueManipulator.
   */
  export class CompositeUpdater
    extends ValueUpdater<any, any>
    implements ValueManipulator<any, any> {

    /**
     * The ValueExtractor part.
     */
    protected readonly extractor: ValueExtractor<any, any>

    /**
     * The ValueUpdater part.
     */
    protected readonly updater: ValueUpdater<any, any>

    /**
     * Constructs a new `CompositeUpdater`.
     *
     * @param methodOrExtractor  the {@link ValueExtractor} or the name of the method to invoke via reflection
     * @param updater            the {@link ValueUpdater}
     */
    constructor (methodOrExtractor: string | ValueExtractor<any, any>, updater?: ValueUpdater<any, any>) {
      super(extractorName(('CompositeUpdater')))
      if (updater) {
        // Two arg constructor
        this.extractor = methodOrExtractor as ValueExtractor<any, any>
        this.updater = updater
      } else {
        // One arg with method name
        const methodName = methodOrExtractor as string
        util.ensureNonEmptyString(methodName, 'method name has to be non empty')

        const last = methodName.lastIndexOf('.')
        this.extractor = last == -1
          ? IdentityExtractor.INSTANCE
          : new ChainedExtractor(methodName.substring(0, last))
        this.updater = new UniversalUpdater(methodName.substring(last + 1))
      }
    }

    /**
     * @inheritDoc
     */
    getExtractor (): ValueExtractor<any, any> {
      return this.extractor
    }

    /**
     * @inheritDoc
     */
    getUpdater (): ValueUpdater<any, any> {
      return this.updater
    }
  }

  /**
   * Universal ValueUpdater implementation.
   *
   * Either a property-based and method-based {@link ValueUpdater}
   * based on whether constructor parameter *name* is evaluated to be a property or method.
   */
  export class UniversalUpdater<T, E>
    extends ValueUpdater<T, E> {
    /**
     * The method or property name.
     */
    protected readonly name: string

    /**
     * Construct a UniversalUpdater for the provided name.
     * If <code>method</code> ends in a '()',
     * then the name is a method name. This implementation assumes that a
     * target's class will have one and only one method with the
     * specified name and this method will have exactly one parameter;
     * if the method is a property name, there should be a corresponding
     * JavaBean property modifier method or it will be used as a
     * key in a {@link Map}.
     *
     * @param method a method or property name
     */
    constructor (method: string) {
      super(extractorName('UniversalUpdater'))
      this.name = method
    }
  }

  function extractorName (name: string): string {
    return 'extractor.' + name
  }
}

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
  static chained<T, R> (extractorsOrFields: extractor.ValueExtractor<any, any>[] | string): extractor.ValueExtractor<T, R> {
    let extractors = new Array<extractor.ValueExtractor<T, R>>()

    if (extractorsOrFields && (typeof extractorsOrFields === 'string')) {
      const s = extractorsOrFields as string
      if (s.length > 0) {
        for (const fieldName of s.split('.')) {
          extractors.push(Extractors.extract<T, R>(fieldName))
        }
      }
    } else {
      extractors = extractorsOrFields as extractor.ValueExtractor<any, any>[]
    }

    if (extractors.length == 1) {
      return extractors[0]
    }
    return new extractor.ChainedExtractor<any, any>(extractors)
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
  static extract<T, E> (from: string, params?: any[]): extractor.ValueExtractor<T, E> {
    if (params) {
      if (!from.endsWith('()')) {
        from = from + '()'
      }
    }

    return new extractor.UniversalExtractor(from, params)
  }

  /**
   * Returns an extractor that always returns its input argument.
   *
   * @typeParam T  the type of the input and output objects to the function
   *
   * @return an extractor that always returns its input argument
   */
  static identity<T> (): extractor.ValueExtractor<T, T> {
    return extractor.IdentityExtractor.INSTANCE
  }

  /**
   * Returns an extractor that casts its input argument.
   *
   * @typeParam T  the type of the input objects to the function
   * @typeParam E  the type of the output objects to the function
   *
   * @return an extractor that always returns its input argument
   */
  static identityCast<T, E> (): extractor.ValueExtractor<T, E> {
    return extractor.IdentityExtractor.INSTANCE
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
  static multi<T> (extractorOrFields: extractor.ValueExtractor<T, any>[] | string): extractor.ValueExtractor<T, any[]> {
    let extractors: extractor.ValueExtractor<T, any>[] = new Array<extractor.ValueExtractor<T, any>>()
    if (typeof extractorOrFields[0] === 'string') {
      for (const f in extractorOrFields as String) {
        extractors.push(Extractors.chained(f))
      }
    } else {
      extractors = extractorOrFields as extractor.ValueExtractor<T, any>[]
    }

    return new extractor.MultiExtractor(extractors)
  }
}
