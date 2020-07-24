/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { Filter } from '../filter/'
import { internal } from './package-internal'


export abstract class EntryProcessor<K = any, V = any, R = any>
  implements EntryProcessor<K, V, R> {
  '@class': string

  protected constructor (clz: string) {
    this['@class'] = clz
  }

  andThen (processor: EntryProcessor<K, V>): CompositeProcessor<K, V> {
    return new CompositeProcessor(this, processor)
  }

  when (filter: Filter<V>): EntryProcessor<K, V, R> {
    return new ConditionalProcessor(filter, this)
  }
}

/**
 * ConditionalProcessor` represents a processor that is invoked
 * conditionally based on the result of an entry evaluation.  A
 * `ConditionalProcessor` is returned from the `when()` function, which
 * takes a filter as its argument.
 *
 * @param {@link Filter} the argument to `when()`
 *
 * @example
 * var processor = Processor.extract('name').when(Filter.greater('age', 40));
 * map.invokeAll(Filter.equal('gender', 'Male'), processor)
 *      .then(function (data) {
 *        console.log("Male over 40: " + data.name);
 *      });
 */
export class ConditionalProcessor<K, V, T>
  extends EntryProcessor<K, V, T> {
  filter: Filter<V>

  processor: EntryProcessor<K, V, T>

  /**
   * Construct a ConditionalProcessor for the specified filter and the
   * processor.
   * <p>
   * The specified entry processor gets invoked if and only if the filter
   * applied to the cache entry evaluates to true; otherwise the
   * result of the {@link #process} invocation will return <tt>null</tt>.
   *
   * @param filter     the filter
   * @param processor  the entry processor
   */
  constructor (filter: Filter<V>, processor: EntryProcessor<K, V, T>) {
    super(internal.processorName('ConditionalProcessor'))

    this.filter = filter
    this.processor = processor
  }
}

/**
 * CompositeProcessor represents a collection of entry processors that are
 * invoked sequentially against the same MapEntry.
 *
 * @param <K> the type of the MapEntry key
 * @param <V> the type of the MapEntry value
 * @param <R> the type of the EntryProcessor return value
 */
export class CompositeProcessor<K, V>
  extends EntryProcessor<K, V> {
  public static EMPTY_PROCESSOR_ARRAY = new Array<EntryProcessor>()

  processors: Array<EntryProcessor<K, V>>

  constructor (...processors: EntryProcessor<K, V, any>[]) {
    super(internal.processorName('CompositeProcessor'))
    this.processors = processors
  }

  andThen (processor: EntryProcessor<K, V>): this {
    this.processors.push(processor)
    return this
  }
}
