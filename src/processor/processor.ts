/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { Filter } from '../filter/'
import { internal } from './package-internal'

/**
 * An invocable agent that operates against the entries within a NamedMap.
 *
 * @typeParam K  the type of the Map entry key
 * @typeParam V  the type of the Map entry value
 * @typeParam R  the type of value returned by the EntryProcessor
 */
export abstract class EntryProcessor<K = any, V = any, R = any>
  implements EntryProcessor<K, V, R> {
  '@class': string

  /**
   * Constructs a new `EntryProcessor`.
   *
   * @param clz  Server-side `EntryProcessor` implementation type identifier.
   */
  protected constructor (clz: string) {
    this['@class'] = clz
  }

  /**
   * Returns a {@link CompositeProcessor} comprised of this and the provided processor.
   *
   * @param processor  the next processor
   *
   * @return a {@link CompositeProcessor} comprised of this and the provided processor
   */
  andThen (processor: EntryProcessor<K, V>): CompositeProcessor<K, V> {
    return new CompositeProcessor(this, processor)
  }

  /**
   * Returns a {@link ConditionalProcessor} comprised of this processor and the provided filter.
   *
   * The specified entry processor gets invoked if and only if the filter
   * applied to the entry evaluates to `true`; otherwise the
   * result of the invocation will return `null`.
   *
   * @param filter  the filter
   */
  when (filter: Filter<V>): EntryProcessor<K, V, R> {
    return new ConditionalProcessor(filter, this)
  }
}

// TODO(rlubke) - find Processor.extract
/**
 * ConditionalProcessor` represents a processor that is invoked
 * conditionally based on the result of an entry evaluation.  A
 * `ConditionalProcessor` is returned from the `when()` function, which
 * takes a filter as its argument.
 *
 * @typeParam K  the type of the Map entry key
 * @typeParam V  the type of the Map entry value
 * @typeParam R  the type of value returned by the EntryProcessor
 */
export class ConditionalProcessor<K, V, R>
  extends EntryProcessor<K, V, R> {

  /**
   * The underlying filter.
   */
  protected filter: Filter<V>

  /**
   * The underlying entry processor.
   */
  processor: EntryProcessor<K, V, R>

  /**
   * Construct a ConditionalProcessor for the specified filter and the
   * processor.
   *
   * The specified entry processor gets invoked if and only if the filter
   * applied to the cache entry evaluates to `true`; otherwise the
   * result of the invocation will return `null`.
   *
   * @param filter     the filter
   * @param processor  the entry processor
   */
  constructor (filter: Filter<V>, processor: EntryProcessor<K, V, R>) {
    super(internal.processorName('ConditionalProcessor'))
    this.filter = filter
    this.processor = processor
  }
}

/**
 * CompositeProcessor represents a collection of entry processors that are
 * invoked sequentially against the same MapEntry.
 *
 * @typeParam K  the type of the Map entry key
 * @typeParam V  the type of the Map entry value
 * @typeParam R  the type of value returned by the EntryProcessor
 */
export class CompositeProcessor<K, V>
  extends EntryProcessor<K, V> {
  public static EMPTY_PROCESSOR_ARRAY = new Array<EntryProcessor>()

  /**
   * The underlying entry processor array.
   */
  protected processors: Array<EntryProcessor<K, V>>

  /**
   * Construct a `CompositeProcessor` for the specified array of individual
   * entry processors.
   *
   * The result of the `CompositeProcessor` execution is an array of results
   * returned by the individual EntryProcessor invocations.
   *
   * @param processors  the entry processor array
   */
  constructor (... processors: EntryProcessor<K, V>[]) {
    super(internal.processorName('CompositeProcessor'))
    this.processors = processors
  }

  /**
   * @inheritDoc
   */
  andThen (processor: EntryProcessor<K, V>): this {
    this.processors.push(processor)
    return this
  }
}
