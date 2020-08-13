/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { Util } from '../util/util' // not exported by default
import { internal } from './package-internal'

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
   * The extraction target.
   */
  protected _target: Target

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
    Util.ensureNotNull(before, 'before cannot be null')

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
    Util.ensureNotNull(after, 'before cannot be null')

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
    super(internal.extractorName('UniversalExtractor'), target)
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
    super(internal.extractorName('ChainedExtractor'),
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
    super(internal.extractorName('IdentityExtractor'))
  }
}
