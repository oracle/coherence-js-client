/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { util } from './util'

export namespace extractor {

  /**
   * ValueExtractor is used to both extract values (for example, for sorting
   * or filtering) from an object, and to provide an identity for that extraction.
   */
  export abstract class ValueExtractor {
    /**
     * Server-side ValueExtractor implementation type identifier.
     */
    protected '@class': string

    /**
     * Construct a ValueExtractor.
     *
     * @param clz     server-side ValueExtractor implementation type identifier
     */
    protected constructor (clz: string) {
      this['@class'] = clz
    }

    /**
     * Returns a composed extractor that first applies the *before*
     * extractor to its input, and then applies this extractor to the result.
     * If evaluation of either extractor throws an exception, it is relayed
     * to the caller of the composed extractor.
     *
     * @param before  the extractor to apply before this extractor is applied
     *
     * @return a composed extractor that first applies the *before*
     *         extractor and then applies this extractor
     */
    compose (before: ValueExtractor): ValueExtractor {
      util.ensureNotNull(before, 'before cannot be null')

      return (before instanceof ChainedExtractor)
        ? before.andThen(this)
        : new ChainedExtractor([before, this])
    }

    /**
     * Returns a composed extractor that first applies this extractor to its
     * input, and then applies the *after* extractor to the result. If
     * evaluation of either extractor throws an exception, it is relayed to
     * the caller of the composed extractor.
     *
     * @param after   the extractor to apply after this extractor is applied
     *
     * @return a composed extractor that first applies this extractor and then
     *         applies the *after* extractor
     */
    andThen (after: ValueExtractor): ValueExtractor {
      util.ensureNotNull(after, 'before cannot be null')

      return (!(after instanceof ChainedExtractor))
        ? after.compose(this)
        : new ChainedExtractor([this, after])
    }
  }

  /**
   * Abstract super class for {@link ValueExtractor} implementations that are based on
   * an underlying array of {@link ValueExtractor} objects.
   */
  export class AbstractCompositeExtractor
    extends ValueExtractor {
    extractors: ValueExtractor[]

    /**
     * Constructs a new AbstractCompositeExtractor.
     *
     * @param typeName    the server-side ValueExtractor implementation type identifier.
     * @param extractors  an array of extractors
     */
    protected constructor (typeName: string, extractors: ValueExtractor[]) {
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
   */
  export class UniversalExtractor
    extends ValueExtractor {

    /**
     * A method or property name.
     */
    protected name: string

    /**
     * The parameter array. Must be `null` or `zero length` for a property based extractor.
     */
    protected params?: any[]

    /**
     * Construct a UniversalExtractor based on a name and optional
     * parameters.
     *
     * If *name* does not end in `()`, this extractor is a property extractor.
     * If `name` is prefixed with one of `set` or `get` and ends in `()`,
     * this extractor is a property extractor. If the *name*
     * just ends in `()`, this extractor is considered a method extractor.
     *
     * @param name    a method or property name
     * @param params  the array of arguments to be used in the method
     *                invocation; may be `null`
     */
    constructor (name: string, params?: any[]) {
      super(extractorName('UniversalExtractor'))
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
   */
  export class ChainedExtractor
    extends AbstractCompositeExtractor {

    /**
     * Create a new `ChainedExtractor`.
     *
     * @param extractorsOrMethod  an array of {@link ValueExtractor}s, or a dot-delimited sequence of method
     *                            names which results in a ChainedExtractor that is based on an array of
     *                            corresponding {@link UniversalExtractor} objects
     */
    constructor (extractorsOrMethod: ValueExtractor[] | string) {
      super(extractorName('ChainedExtractor'),
        ((typeof extractorsOrMethod === 'string')
          ? ChainedExtractor.createExtractors(extractorsOrMethod)
          : extractorsOrMethod))
    }

    /**
     * Create a new `ChainedExtractor` based on the provided dot-delimited sequence of method names.
     *
     * @param fields  a dot-delimited sequence of method names
     *
     * @return an array of {@link ValueExtractor}s based on the input string
     */
    protected static createExtractors (fields: string): ValueExtractor[] {
      const names = fields.split('.').filter(f => f != null && f.length > 0)
      const arr = new Array<ValueExtractor>()
      for (const name of names) {
        arr.push(new UniversalExtractor(name))
      }

      return arr
    }
  }

  /**
   * A Trivial {@link ValueExtractor} implementation that does not actually extract
   * anything from the passed value, but returns the value itself.
   */
  export class IdentityExtractor
    extends ValueExtractor {
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
    extends AbstractCompositeExtractor {
    /**
     * Constructs a new `MultiExtractor`.
     *
     * @param extractorsOrMethod  an array of {@link ValueExtractor}s or a comma-delimited
     *                            of method names which results in a MultiExtractor that
     *                            is based on a corresponding array of {@link ValueExtractor} objects
     */
    constructor (extractorsOrMethod: ValueExtractor[] | string) {
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
    protected static createExtractors (methods: string): ValueExtractor[] {
      const names = methods.split(',').filter(f => f != null && f.length > 0)
      const arr = new Array<ValueExtractor>()
      for (const name of names) {
        arr.push(name.indexOf('.') < 0 ? new UniversalExtractor(name) : new ChainedExtractor(name))
      }

      return arr
    }
  }


  /**
   * ValueUpdater is used to update an object's state.
   */
  export abstract class ValueUpdater {
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
   */
  export interface ValueManipulator {

    /**
     * Retrieve the underlying ValueExtractor reference.
     *
     * @return the ValueExtractor
     */
    getExtractor (): ValueExtractor;

    /**
     * Retrieve the underlying ValueUpdater reference.
     *
     * @return the ValueUpdater
     */
    getUpdater (): ValueUpdater;
  }

  /**
   * A ValueUpdater implementation based on an extractor-updater pair that could
   * also be used as a ValueManipulator.
   */
  export class CompositeUpdater
    extends ValueUpdater
    implements ValueManipulator {

    /**
     * The ValueExtractor part.
     */
    protected readonly extractor: ValueExtractor

    /**
     * The ValueUpdater part.
     */
    protected readonly updater: ValueUpdater

    /**
     * Constructs a new `CompositeUpdater`.
     *
     * @param methodOrExtractor  the {@link ValueExtractor} or the name of the method to invoke via reflection
     * @param updater            the {@link ValueUpdater}
     */
    constructor (methodOrExtractor: string | ValueExtractor, updater?: ValueUpdater) {
      super(extractorName(('CompositeUpdater')))
      if (updater) {
        // Two arg constructor
        this.extractor = methodOrExtractor as ValueExtractor
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
    getExtractor (): ValueExtractor {
      return this.extractor
    }

    /**
     * @inheritDoc
     */
    getUpdater (): ValueUpdater {
      return this.updater
    }
  }

  /**
   * Universal ValueUpdater implementation.
   *
   * Either a property-based and method-based {@link ValueUpdater}
   * based on whether constructor parameter *name* is evaluated to be a property or method.
   */
  export class UniversalUpdater
    extends ValueUpdater {
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
     * key in a Map.
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
   * @param extractorsOrFields  If extractorsOrFields is a string type, then the
   *                            field names to extract (if any field name contains a dot '.'
   *                            that field name is split into multiple field names delimiting on
   *                            the dots. If extractorsOrFields is of ValueExtractor[] type,
   *                            then the {@link ValueExtractor}s are used to extract the values
   *
   * @return an extractor that extracts the value(s) of the specified field(s)
   */
  static chained (extractorsOrFields: extractor.ValueExtractor[] | string): extractor.ValueExtractor {
    let extractors = new Array<extractor.ValueExtractor>()

    if (extractorsOrFields && (typeof extractorsOrFields === 'string')) {
      const s = extractorsOrFields as string
      if (s.length > 0) {
        for (const fieldName of s.split('.')) {
          extractors.push(Extractors.extract(fieldName))
        }
      }
    } else {
      extractors = extractorsOrFields as extractor.ValueExtractor[]
    }

    if (extractors.length == 1) {
      return extractors[0]
    }
    return new extractor.ChainedExtractor(extractors)
  }

  /**
   * Returns an extractor that extracts the value of the specified field.
   *
   * @param from    the name of the field or method to extract the value from.
   * @param params  the parameters to pass to the method.
   *
   * @return an extractor that extracts the value of the specified field.
   */
  static extract (from: string, params?: any[]): extractor.ValueExtractor {
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
   * @return an extractor that always returns its input argument
   */
  static identity (): extractor.ValueExtractor {
    return extractor.IdentityExtractor.INSTANCE
  }

  /**
   * Returns an extractor that casts its input argument.
   *
   * @return an extractor that always returns its input argument
   */
  static identityCast (): extractor.ValueExtractor {
    return extractor.IdentityExtractor.INSTANCE
  }

  /**
   * Returns an extractor that extracts the specified fields
   * and returns the extracted values in an array.
   *
   * @param extractorOrFields  the field names to extract
   *
   * @return an extractor that extracts the value(s) of the specified field(s)
   */
  static multi (extractorOrFields: extractor.ValueExtractor[] | string): extractor.MultiExtractor {
    return new extractor.MultiExtractor(extractorOrFields)
  }
}
