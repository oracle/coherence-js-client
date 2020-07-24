/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { Util } from '../util/util'

export enum Target { VALUE = 0, KEY = 1 }

/**
 * ValueExtractor is used to both extract values (for example, for sorting
 * or filtering) from an object, and to provide an identity for that extraction.
 */
export abstract class ValueExtractor<T = any, E = any> {
  public '@class': string

  protected target: Target

  protected constructor (clz: string, target: Target = Target.VALUE) {
    this['@class'] = Util.toExtractorName(clz)
    this.target = target
  }

  /**
   * Returns an extractor that casts its input argument.
   *
   * @param <T> the type of the input objects to the function
   * @param <E> the type of the output objects to the function
   *
   * @return an extractor that always returns its input argument
   */
  static identityCast<P, Q> (): ValueExtractor<P, Q> {
    return IdentityExtractor.INSTANCE
  }

  getTarget (): Target {
    if (!this.target) {
      throw new Error('Internal error; unknown target')
    }
    return this.target
  }

  compose (before: ValueExtractor): ValueExtractor {
    Util.ensureNotNull(before, 'before cannot be null')

    return (before instanceof ChainedExtractor)
      ? before.andThen(this)
      : new ChainedExtractor([before, this])
  }

  /**
   * Returns a composed extractor that first applies this extractor to its
   * input, and then applies the {@code after} extractor to the result. If
   * evaluation of either extractor throws an exception, it is relayed to
   * the caller of the composed extractor.
   *
   * @param <V>   the type of output of the {@code after} extractor, and of
   *              the composed extractor
   * @param after the extractor to apply after this extractor is applied
   *
   * @return a composed extractor that first applies this extractor and then
   *         applies the {@code after} extractor
   *
   * @throws NullPointerException if the passed extractor is null
   *
   * @see #compose(ValueExtractor)
   */
  andThen<V = any> (after: ValueExtractor<E, V>): ValueExtractor<T, V> {
    Util.ensureNotNull(after, 'before cannot be null')

    return (!(after instanceof ChainedExtractor))
      ? after.compose(this)
      : new ChainedExtractor<T, V>([this, after])
  }
}

export class AbstractCompositeExtractor<T = any, E = any>
  extends ValueExtractor<T, T> {
  extractors: ValueExtractor<T, E>[]

  constructor (typeName: string, extractors: ValueExtractor<T, E>[]) {
    super(typeName)
    this.extractors = extractors
  }
}

export class ReflectionExtractor<T, E>
  extends ValueExtractor<T, E> {
  method: string

  args?: any[]

  constructor (method: string, args?: any[], target?: Target | undefined) {
    super('ReflectionExtractor', target)
    this.method = method
    if (args) {
      this.args = args
    }
  }
}

export class ChainedExtractor<T = any, E = any>
  extends AbstractCompositeExtractor<T, E> {
  // constructor(extractors: ValueExtractor[]);
  // constructor(method: string);
  constructor (extractorsOrMethod: ValueExtractor<T, E>[] | string) {
    if (typeof extractorsOrMethod === 'string') {
      super('ChainedExtractor', ChainedExtractor.createExtractors(extractorsOrMethod))
    } else {
      super('ChainedExtractor', extractorsOrMethod)
    }
    this.target = this.computeTarget()
  }

  protected static createExtractors (fields: string): ValueExtractor<any, any>[] {
    const names = fields.split('.').filter(f => f != null && f.length > 0)
    const arr = new Array<ValueExtractor<any, any>>()
    for (const name of names) {
      arr.concat(new ReflectionExtractor(name))
    }

    return arr
  }

  protected computeTarget (): Target {
    const aExtractor = this.extractors

    let result = Target.VALUE
    if (aExtractor != null && aExtractor.length > 0) {
      const extType: string = typeof aExtractor[0]
      if (extType === 'AbstractExtractor') {
        result = aExtractor[0].getTarget()
      }
    }
    return result
  }

  protected merge (head: ValueExtractor<any, any>[], tail: ValueExtractor<any, any>[]): ValueExtractor<any, any>[] {
    const arr: any[] = []
    arr.concat(head)
    arr.concat(tail)

    return arr
  }
}

export class IdentityExtractor<T = any>
  extends ValueExtractor<T, T> {
  public static INSTANCE = new IdentityExtractor()

  constructor () {
    super('IdentityExtractor')
  }
}
