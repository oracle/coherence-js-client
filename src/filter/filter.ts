/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ChainedExtractor, ReflectionExtractor, ValueExtractor } from '../extractor/'
import { KeyAssociatedFilter } from '../filter/'
import { internal } from './package-internal'

export abstract class Filter<T = any> {
  '@class': string

  protected constructor (clz: string) {
    this['@class'] = clz
  }

  and (other: Filter): Filter {
    return new AndFilter(this, other)
  }

  or (other: Filter): Filter {
    return new OrFilter(this, other)
  }

  xor (other: Filter): Filter {
    return new XorFilter(this, other)
  }

  // TODO(rlubke) test
  associatedWith (key: object): KeyAssociatedFilter<T> {
    return new KeyAssociatedFilter(this, key)
  }

  forKeys<K> (keys: Set<K>) {
    return new InKeySetFilter(this, keys)
  }

  evaluate (o: T) {
    throw new Error('evaluate not implemented')
  }
}

export abstract class ExtractorFilter<T, E>
  extends Filter<T> {
  extractor: ValueExtractor<T, E>

  protected constructor (typeName: string, extractorOrMethod: ValueExtractor<T, E> | string) {
    super(typeName)
    this.extractor = (extractorOrMethod instanceof ValueExtractor)
      ? extractorOrMethod
      : (extractorOrMethod.indexOf('.') < 0)
        ? new ReflectionExtractor(extractorOrMethod)
        : new ChainedExtractor(extractorOrMethod)
  }
}

/**
 * Filter which compares the result of a method invocation with a value.
 *
 * @param <T> the type of the input argument to the filter
 * @param <E> the type of the extracted attribute to use for comparison
 * @param <C> the type of value to compare extracted attribute with
 */
export abstract class ComparisonFilter<T, E, C>
  extends ExtractorFilter<T, E> {
  value: C

  protected constructor (typeName: string, extractorOrMethod: ValueExtractor<T, E> | string, value: C) {
    super(typeName, extractorOrMethod)
    this.value = value
  }
}

export abstract class ArrayFilter
  extends Filter {
  protected filters: Filter[]

  protected constructor (clz: string, filters: Filter[]) {
    super(clz)
    this.filters = filters
  }
}

export class AnyFilter
  extends ArrayFilter {
  constructor (filters: Filter[]) {
    super(internal.filterName('AnyFilter'), filters)
  }
}

export class AllFilter
  extends ArrayFilter {
  constructor (filters: Filter[]) {
    super(internal.filterName('AllFilter'), filters)
  }
}

export class AndFilter
  extends AllFilter {
  constructor (first: Filter, second: Filter) {
    super([first, second])
    this['@class'] = internal.filterName('AndFilter')
  }
}

export class OrFilter
  extends AnyFilter {
  constructor (first: Filter, second: Filter) {
    super([first, second])
    this['@class'] = internal.filterName('OrFilter')
  }
}

export class XorFilter
  extends ArrayFilter {
  constructor (first: Filter, second: Filter) {
    super(internal.filterName('XorFilter'), [first, second])
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
  filter: Filter<T>

  keys: Set<K>

  constructor (filter: Filter<T>, keys: Set<K>) {
    super('InKeySetFilter')
    this.filter = filter
    this.keys = keys
  }
}
