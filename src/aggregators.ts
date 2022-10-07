/*
 * Copyright (c) 2020, 2022 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { extractor, Extractors } from './extractors'
import { filter } from './filters'
import { MapEntry } from './named-cache-client'

import { util } from './util'

export namespace aggregator {

  /**
   * An EntryAggregator represents processing that can be directed to occur
   * against some subset of the entries in an cache, resulting in a
   * aggregated result. Common examples of aggregation include functions such
   * as min(), max() and avg(). However, the concept of aggregation applies to
   * any process that needs to evaluate a group of entries to come up with a
   * single answer.
   *
   * @typeParam K  the type of the Map entry key
   * @typeParam V  the type of the Map entry value
   * @typeParam R  the type of the aggregation result
   */
  export abstract class EntryAggregator<K = any, V = any, R = any> {
    /**
     * Server-side EntryAggregator implementation type identifier.
     */
    protected '@class': string

    /**
     * The {@link extractor.ValueExtractor} to apply when aggregating results.
     *
     */
    protected extractor?: extractor.ValueExtractor

    /**
     * Construct an AbstractAggregator that will aggregate values extracted from the cache entries.
     *
     * @param clz                  the server-side EntryAggregator implementation type identifier
     * @param extractorOrProperty  the extractor that provides values to aggregate or the name of the method that
     *                             could be invoked via Java reflection and that returns values to aggregate; this
     *                             parameter can also be a dot-delimited sequence of method names which would
     *                             result in an aggregator based on the {@link ChainedExtractor} that is based on
     *                             an array of corresponding {@link UniversalExtractor} objects; must not be `null`
     */
    protected constructor (clz: string, extractorOrProperty?: extractor.ValueExtractor | string) {
      this['@class'] = clz
      if (extractorOrProperty) {
        if (extractorOrProperty instanceof extractor.ValueExtractor) {
          this.extractor = extractorOrProperty
        } else {
          this.extractor = new extractor.UniversalExtractor(extractorOrProperty)
        }
      }
    }

    /**
     * Returns a {@link CompositeAggregator} comprised of this and the provided aggregator.
     *
     * @param aggregator  the next aggregator
     *
     * @return a {@link CompositeAggregator} comprised of this and the provided aggregator
     */
    andThen(aggregator: EntryAggregator<K, V, R>): EntryAggregator<K, V, R> {
      return new CompositeAggregator([this, aggregator])
    }
  }

  /**
   * Abstract aggregator that processes values extracted from a set of entries
   * in a Map, with knowledge of how to compare those values. There are two way
   * to use the AbstractComparableAggregator:
   * <ul>
   * <li>All the extracted objects must implement the Java Comparable interface, or</li>
   * <li>The AbstractComparableAggregator has to be provided with a
   * {@link Comparator} object.</li>  This {@link Comparator} must exist on the server in order
   * to be usable.
   * </ul>
   * If there are no entries to aggregate, the returned result will be `null`.
   *
   * @typeParam R  the type of the aggregation result
   */
  export abstract class AbstractComparableAggregator<R>
    extends EntryAggregator<any, any, R> {
    /**
     * Construct an AbstractComparableAggregator that will aggregate Java-Comparable values extracted
     * from the cache entries.
     *
     * @param clz                  the server-side EntryAggregator implementation type identifier
     * @param extractorOrProperty  the extractor that provides values to aggregate or the name of the method that
     *                             could be invoked via Java reflection and that returns values to aggregate; this
     *                             parameter can also be a dot-delimited sequence of method names which would
     *                             result in an aggregator based on the {@link ChainedExtractor} that is based on
     *                             an array of corresponding {@link UniversalExtractor} objects
     */
    protected constructor (clz: string, extractorOrProperty: extractor.ValueExtractor | string) {
      super(clz, extractorOrProperty)
    }
  }

  /**
   * Abstract aggregator that processes numeric values extracted from a set of
   * entries in a Map. All the extracted Number objects will be treated as Java
   * <tt>double</tt> values and the result of the aggregator is a Double.
   * If the set of entries is empty, a <tt>null</tt> result is returned.
   */
  export abstract class AbstractDoubleAggregator
    extends EntryAggregator<any, any, number> {

    /**
     * Construct an AbstractDoubleAggregator that will aggregate numeric values extracted
     * from the cache entries.
     *
     * @param clz                  the server-side EntryAggregator implementation type identifier
     * @param extractorOrProperty  the extractor that provides values to aggregate or the name of the method that
     *                             could be invoked via Java reflection and that returns values to aggregate; this
     *                             parameter can also be a dot-delimited sequence of method names which would
     *                             result in an aggregator based on the {@link ChainedExtractor} that is based on
     *                             an array of corresponding {@link UniversalExtractor} objects
     */
    protected constructor (clz: string, extractorOrProperty: extractor.ValueExtractor | string) {
      super(clz, extractorOrProperty)
    }
  }

  /**
   * Calculates an average for values of any numeric type extracted from a
   * set of entries in a Map in a form of a numerical value. All the
   * extracted objects will be treated as numerical values. If the set of
   * entries is empty, a `nul`l result is returned.
   */
  export class AverageAggregator
    extends AbstractDoubleAggregator {

    /**
     * Construct an AverageAggregator that will sum numeric values extracted
     * from the cache entries.
     *
     * @param extractorOrProperty   the extractor that provides a value in the form of any numeric object or
     *                              the name of the method that could be invoked via Java reflection and that
     *                              returns numeric values to aggregate; this parameter can also be a dot-delimited
     *                              sequence of method names which would result in an aggregator based on the
     *                              {@link ChainedExtractor} that is based on an array of corresponding
     *                              {@link UniversalExtractor} objects.  May not be null
     */
    constructor (extractorOrProperty: extractor.ValueExtractor | string) {
      super(aggregatorName('BigDecimalAverage'), extractorOrProperty)
    }
  }

  /**
   * `CompositeAggregator` provides an ability to execute a collection of
   * aggregators against the same subset of the entries in an
   * Map, resulting in a list of corresponding aggregation
   * results. The size of the returned list will always be equal to the
   * length of the aggregators' array.
   */
  export class CompositeAggregator<K = any, V = any>
    extends EntryAggregator<K, V, Array<any>> {
    aggregators: Array<EntryAggregator>

    /**
     * Construct a CompositeAggregator based on a specified {@link EntryAggregator}
     * array.
     *
     * @param aggregators  an array of EntryAggregator objects; may not be `null`
     */
    constructor (aggregators: Array<EntryAggregator>,) {
      super(aggregatorName('CompositeAggregator'))

      if (aggregators) {
        this.aggregators = aggregators
      } else {
        throw new Error('no aggregators provided')
      }
    }
  }

  /**
   * Calculates a number of values in an entry set.
   */
  export class CountAggregator<K = any, V = any>
    extends EntryAggregator<K, V, number> {

    /**
     * Constructs a new `CountAggregator`.
     */
    constructor () {
      super(aggregatorName('Count'))
    }
  }

  /**
   * Return the set of unique values extracted from a set of entries in a
   * Map. If the set of entries is empty, an empty array is returned.
   *
   * This aggregator could be used in combination with {@link
    * UniversalExtractor} allowing to collect all unique combinations
   * (tuples) of a given set of attributes.
   *
   * The DistinctValues aggregator covers a simple case of a more generic
   * aggregation pattern implemented by the `GroupAggregator`, which in
   * addition to collecting all distinct values or tuples, runs an
   * aggregation against each distinct entry set (group).
   */
  export class DistinctValuesAggregator
    extends AbstractDoubleAggregator {

    /**
     * Construct an AbstractComparableAggregator that will aggregate numeric values extracted
     * from the cache entries.
     *
     * @param extractorOrProperty  the extractor that provides values to aggregate or the name of the method that
     *                             could be invoked via Java reflection and that returns values to aggregate; this
     *                             parameter can also be a dot-delimited sequence of method names which would
     *                             result in an aggregator based on the {@link ChainedExtractor} that is based on
     *                             an array of corresponding {@link UniversalExtractor} objects
     */
    constructor (extractorOrProperty: extractor.ValueExtractor | string) {
      super(aggregatorName('DistinctValues'), extractorOrProperty)
    }
  }

  /**
   * The `GroupAggregator` provides an ability to split a subset of entries
   * in a Map into a collection of non-intersecting subsets and then
   * aggregate them separately and independently. The splitting (grouping)
   * is performed using the results of the underlying {@link
    * UniversalExtractor} in such a way that two entries will belong to the
   * same group if and only if the result of the corresponding extract
   * call produces the same value or tuple (list of values). After the
   * entries are split into the groups, the underlying aggregator is
   * applied separately to each group. The result of the aggregation by
   * the` GroupAggregator` is a Map that has distinct values (or tuples) as
   * keys and results of the individual aggregation as
   * values. Additionally, those results could be further reduced using an
   * optional {@link Filter} object.
   *
   * Informally speaking, this aggregator is analogous to the SQL `group
   * by` and `having` clauses. Note that the `having` Filter is applied
   * independently on each server against the partial aggregation results;
   * this generally implies that data affinity is required to ensure that
   * all required data used to generate a given result exists within a
   * single cache partition. In other words, the `group by` predicate
   * should not span multiple partitions if the `having` clause is used.
   *
   * The `GroupAggregator` is somewhat similar to the DistinctValues
   * aggregator, which returns back a list of distinct values (tuples)
   * without performing any additional aggregation work.
   *
   * @typeParam K  the type of the Map entry keys
   * @typeParam V  the type of the Map entry values
   * @typeParam E  key return type
   * @typeParam R  the type of the group aggregator result
   */
  export class GroupAggregator<K = any, V = any, E = any, R = any>
    extends EntryAggregator<K, V, Map<E, R>> {
    /**
     * The underlying {@link EntryAggregator}.
     */
    protected aggregator: EntryAggregator<K, V, R>

    /**
     * The {@link Filter} object representing the `having` clause of this `group by`
     * aggregator.
     */
    protected filter?: filter.Filter

    /**
     * Construct a `GroupAggregator` based on a specified {@link extractor.ValueExtractor} and
     * underlying {@link EntryAggregator}.
     *
     * @param extractorOrProperty   a {@link extractor.ValueExtractor} object that is used to split entries into non-intersecting
     *                              subsets; may not be `null`. This parameter can also be a dot-delimited
     *                              sequence of method names which would result in an aggregator based on the
     *                              {@link ChainedExtractor} that is based on an array of corresponding
     *                              {@link UniversalExtractor} objects; may not be `null`
     * @param aggregator  an EntryAggregator object; may not be null
     * @param filter      an optional Filter object used to filter out
     *                    results of individual group aggregation results
     */
    constructor (extractorOrProperty: extractor.ValueExtractor | string, aggregator: EntryAggregator<K, V, R>, filter?: filter.Filter) {
      super(aggregatorName('GroupAggregator'), extractorOrProperty)

      if (aggregator) {
        this.aggregator = aggregator
      } else {
        throw new Error('no aggregator provided')
      }
      this.filter = filter
    }
  }

  /**
   * Calculates a maximum of numeric values extracted from a set of
   * entries in a Map in a form of a numerical value. All the extracted
   * objects will be treated as numerical values. If the set of entries is
   * empty, a `null` result is returned.
   */
  export class MaxAggregator
    extends AbstractComparableAggregator<number> {

    /**
     * Constructs a new `MaxAggregator`.
     *
     * @param extractorOrProperty   the extractor that provides a value in the form of any numeric object or
     *                              the name of the method that could be invoked via Java reflection and that
     *                              returns numeric values to aggregate; this parameter can also be a dot-delimited
     *                              sequence of method names which would result in an aggregator based on the
     *                              {@link ChainedExtractor} that is based on an array of corresponding
     *                              {@link UniversalExtractor} objects.  May not be null
     */
    constructor (extractorOrProperty: extractor.ValueExtractor | string) {
      super(aggregatorName('ComparableMax'), extractorOrProperty)
    }
  }

  /**
   * Calculates a minimum of numeric values extracted from a set of
   * entries in a Map in a form of a numerical value. All the extracted
   * objects will be treated as numerical values. If the set of entries is
   * empty, a `null` result is returned.
   */
  export class MinAggregator
    extends AbstractDoubleAggregator {

    /**
     * Constructs a new `MinAggregator`.
     *
     * @param extractorOrProperty   the extractor that provides a value in the form of any numeric object or
     *                              the name of the method that could be invoked via Java reflection and that
     *                              returns numeric values to aggregate; this parameter can also be a dot-delimited
     *                              sequence of method names which would result in an aggregator based on the
     *                              {@link ChainedExtractor} that is based on an array of corresponding
     *                              {@link UniversalExtractor} objects.  May not be null
     */
    constructor (extractorOrProperty: extractor.ValueExtractor | string) {
      super(aggregatorName('ComparableMin'), extractorOrProperty)
    }
  }

  /**
   * `PriorityAggregator` is used to explicitly control the scheduling priority and
   * timeouts for execution of EntryAggregator-based methods.
   * <p>
   * For example, let's assume that there is an `Orders`</i>` cache that belongs to
   * a partitioned cache service configured with a *request-timeout* and
   * *task-timeout* of 5 seconds.
   * Also assume that we are willing to wait longer for a particular
   * aggregation request that scans the entire cache. Then we could override the
   * default timeout values by using the PriorityAggregator as follows:
   *
   * ```javascript
   * const sumAggr = new SumAggregator('cost')
   * const priorityAgg = new PriorityAggregator(sumAggr)
   * priorityAgg.executionTimeout = Timeout.NONE
   * priorityAgg.requestTimeout = Timeout.NONE
   * cacheOrders.aggregate(aFilter, priorityAgg)
   * ```
   * <p>
   * This is an advanced feature which should be used judiciously.
   *
   * @typeParam K  the type of the Map entry keys
   * @typeParam V  the type of the Map entry values
   * @typeParam R  the type of the final result
   */
  export class PriorityAggregator<K = any, V = any, R = any>
    extends EntryAggregator<K, V, R> {

    /**
     * The wrapped {@link EntryAggregator}.
     */
    protected aggregator: EntryAggregator<K, V, R>
    /**
     * The task execution timeout value.
     */
    private _executionTimeout: number = Timeout.DEFAULT
    /**
     * The request timeout value.
     */
    private _requestTimeout: number = Timeout.DEFAULT

    /**
     * Construct a new `PriorityAggregator`.
     *
     * @param aggregator  the aggregator wrapped by this `PriorityAggregator`
     */
    constructor (aggregator: EntryAggregator<K, V, R>) {
      super(aggregatorName('PriorityAggregator'))
      this.aggregator = aggregator
    }

    /**
     * The scheduling priority.
     */
    private _schedulingPriority: Schedule = Schedule.STANDARD

    /**
     * Return the scheduling priority or, if not explicitly set, the default is {@link Schedule.STANDARD}.
     *
     * @return the scheduling priority, if not explicitly set, the default is {@link Schedule.STANDARD}
     */
    get schedulingPriority (): Schedule {
      return this._schedulingPriority
    }

    /**
     * Set the scheduling priority.
     *
     * @param schedulingPriority the scheduling priority
     */
    set schedulingPriority (schedulingPriority: Schedule) {
      this._schedulingPriority = schedulingPriority
    }

    /**
     * Return the execution timeout in milliseconds.
     *
     * @return the execution timeout in milliseconds
     */
    get executionTimeoutInMillis (): number {
      return this._executionTimeout
    }

    /**
     * Sets the execution timeout.
     *
     * @param timeout the new execution timeout in milliseconds
     */
    set executionTimeoutInMillis (timeout: number) {
      this._executionTimeout = timeout
    }

    /**
     * Return the request timeout in milliseconds.
     *
     * @return the request timeout in milliseconds
     */
    get requestTimeoutInMillis (): number {
      return this._requestTimeout
    }

    /**
     * Sets the request timeout.
     *
     * @param timeout the new request timeout in milliseconds
     */
    set requestTimeoutInMillis (timeout: number) {
      this._requestTimeout = timeout
    }
  }

  /**
   * This aggregator is used to produce an object that contains an estimated or
   * actual cost of the query execution for a given {@link Filter}.
   *
   * For example, the following code will print a *QueryRecord*,
   * containing the estimated query cost and corresponding execution steps.
   *
   * ```javascript
   *   const agent  = new QueryRecorder(RecordType.EXPLAIN);
   *   const record = (QueryRecord) cache.aggregate(someFilter, agent);
   *   console.print(JSON.stringify(record));
   * ```
   *
   * @typeParam K  the type of the Map entry keys
   * @typeParam V  the type of the Map entry values
   */
  export class QueryRecorder<K = any, V = any>
    extends EntryAggregator<K, V> {

    /**
     * String constant for serialization purposes.
     * @internal
     */
    private static readonly EXPLAIN: string = 'EXPLAIN'

    /**
     * String constant for serialization purposes.
     * @internal
     */
    private static readonly TRACE: string = 'TRACE'

    /**
     * The type object to be sent to the remote cluster.
     * @internal
     */
    protected readonly type: object

    /**
     * Construct a new `QueryRecorder`.
     *
     * @param type  the type for this aggregator
     */
    constructor (type: RecordType) {
      super(aggregatorName('QueryRecorder'))
      this.type = QueryRecorder.getType(type)
    }

    /**
     * Create an object that may be deserialized as a Java Enum.
     *
     * @param type  the {@link RecordType}
     * @internal
     */
    private static getType (type: RecordType): object {
      switch (type) {
        case RecordType.EXPLAIN:
          return {enum: this.EXPLAIN}
        case RecordType.TRACE:
          return {enum: this.TRACE}
      }
    }
  }

  /**
   * The `ReducerAggregator` is used to implement functionality similar to
   * {@link NamedMap} *getAll()* API.  Instead of returning the complete
   * set of values, it will return a portion of value attributes based on the
   * provided {@link extractor.ValueExtractor}.
   *
   * This aggregator could be used in combination with {@link MultiExtractor} allowing one
   * to collect tuples that are a subset of the attributes of each object stored in
   * the cache.
   *
   * @typeParam K  the type of the Map entry keys
   * @typeParam V  the type of the Map entry values
   * @typeParam E  extracted value type
   */
  export class ReducerAggregator<K = any, V = any, E = any>
    extends EntryAggregator<K, V, [MapEntry<E, V>]> {

    /**
     * Construct a new `ReducerAggregator`.
     *
     * @param extractorOrProperty  the extractor that provides values to aggregate or the name of the method that
     *                             could be invoked via Java reflection and that returns values to aggregate; this
     *                             parameter can also be a dot-delimited sequence of method names which would
     *                             result in an aggregator based on the {@link ChainedExtractor} that is based on
     *                             an array of corresponding {@link UniversalExtractor} objects
     */
    constructor (extractorOrProperty: extractor.ValueExtractor | string) {
      super(aggregatorName('ReducerAggregator'), extractorOrProperty)
    }
  }

  /**
   * ScriptAggregator is a {@link EntryAggregator} that wraps a script written
   * in one of the languages supported by Graal VM.
   *
   * @typeParam K  the type of the Map entry keys
   * @typeParam V  the type of the Map entry values
   * @typeParam R  the type of the final result
   *
   * @author mk 2019.09.24
   * @since 14.1.1.0
   */
  export class ScriptAggregator<K = any, V = any, R = any>
    extends EntryAggregator<K, V, R> {

    /**
     * The language with which the script is written in.
     */
    protected language: string

    /**
     * The name of the {@link EntryAggregator} that needs to be evaluated.
     */
    protected name: string

    /**
     * The arguments to be passed to the script for evaluation
     */
    protected args: any[]

    /**
     * Present only for serialization purposes.
     * @internal
     */
    protected readonly characteristics: number

    /**
     * Create a {@link EntryAggregator} that wraps the specified script.
     *
     * @param language         the language language with which the script is written in.
     *                         Currently, only `js` (for JavaScript) is supported
     * @param name             the name of the {@link Filter} that needs to
     *                         be evaluated
     * @param args             the arguments to be passed to the script for evaluation
     */
    constructor (language: string, name: string, args?: any[]) {
      super(aggregatorName('ScriptAggregator'))
      if (language !== 'js') {
        throw new Error('Javascript is currently the only supported language')
      }
      this.language = language
      this.name = name
      this.args = args ? args : new Array<any>()
      this.characteristics = 0
    }
  }

  /**
   * Calculates an sum for values of any numeric type extracted from a set of
   * entries in a Map in a form of a numeric value.
   *
   * If the set of entries is empty, a 'null' result is returned.
   */
  export class SumAggregator
    extends AbstractDoubleAggregator {
    /**
     * @param extractorOrProperty the extractor that provides a value in the form of any numeric object or
     *                            the name of the method that could be invoked via Java reflection and that
     *                            returns numeric values to aggregate; this parameter can also be a dot-delimited
     *                            sequence of method names which would result in an aggregator based on the
     *                            {@link ChainedExtractor} that is based on an array of corresponding
     *                            {@link UniversalExtractor} objects.  May not be null
     */
    constructor (extractorOrProperty: extractor.ValueExtractor | string) {
      super(aggregatorName('BigDecimalSum'), extractorOrProperty)
    }
  }

  /**
   * `TopAggregator` aggregates the top *N* extracted values into an array.  The extracted values must not be `null`,
   * but do not need to be unique.
   *
   * @typeParam K  the type of the Map entry keys
   * @typeParam V  the type of the Map entry values
   * @typeParam E  the extracted type
   */
  export class TopAggregator<K = any, V = any, E = any>
    extends EntryAggregator<K, V> {

    /**
     * The maximum number of results to include in the aggregation result.
     */
    protected results: number = 0

    /**
     * Result order.  By default, results will be ordered in descending order.
     */
    protected inverse: boolean = false

    /**
     * The extractor to obtain the values to aggregate.  If not explicitly set,
     * this will default to an {@link IdentityExtractor}.
     */
    protected extractor: extractor.IdentityExtractor = Extractors.identity()

    /**
     * The {@link Comparator} to apply against the extracted values.
     * @private
     */
    protected comparator?: AggregatorComparator

    /**
     * The property that results will be ordered by.
     */
    protected property?: string

    /**
     * Constructs a new `TopAggregator`.
     *
     * @param count  the number of results to include in the aggregation result
     */
    constructor (count: number) {
      super(aggregatorName('TopNAggregator'))
      this.results = count
    }

    /**
     * Order the results based on the values of the specified property.
     *
     * @param property the property name
     */
    orderBy (property: string): TopAggregator<K, V> {
      this.property = property
      this.comparator = new AggregatorComparator(this.property, this.inverse)
      return this
    }

    /**
     * Sort the returned values in ascending order.
     */
    ascending (): TopAggregator<K, V> {
      if (this.property) {
        this.inverse = true
        this.comparator = new AggregatorComparator(this.property, this.inverse)
      }
      return this
    }

    /**
     * Sort the returned values in descending order.
     */
    descending (): TopAggregator<K, V> {
      if (this.property) {
        this.inverse = false
        this.comparator = new AggregatorComparator(this.property, this.inverse)
      }
      return this
    }

    /**
     * The property name of the value to extract.
     *
     * @param property  the property name
     */
    extract (property: string): TopAggregator<K, V> {
      this.inverse = true
      this.extractor = Extractors.extract(property)
      return this
    }
  }

  class AggregatorComparator implements util.Comparator {
    '@class': string
    protected comparator: object

    constructor (property: string, isAsc: boolean) {
      let sortTypeName = 'comparator.InverseComparator'
      if (!isAsc) {
        sortTypeName = 'comparator.SafeComparator'
      }
      let propertyName = property
      this['@class'] = sortTypeName

      this.comparator = {
        '@class': 'comparator.ExtractorComparator',
        'extractor': Extractors.extract(propertyName)
      }
    }
  }


  /**
   * RecordType enum specifies whether the {@link QueryRecorder} should be
   * used to produce an object that contains an estimated or an actual cost of the query execution.
   */
  export enum RecordType {
    /**
     * Produce an object that contains an estimated cost of the query execution.
     */
    EXPLAIN,

    /**
     * Produce an object that contains the actual cost of the query execution.
     */
    TRACE
  }

  /**
   * Available scheduling priorities for use with the {@link PriorityAggregator}.
   */
  export enum Schedule {
    /**
     * Scheduling value indicating that this task is to be queued and executed
     * in a natural (based on the request arrival time) order.
     */
    STANDARD,

    /**
     * Scheduling value indicating that this task is to be queued in front of
     * any equal or lower scheduling priority tasks and executed as soon as any
     * of the worker threads become available.
     */
    FIRST,

    /**
     * Scheduling value indicating that this task is to be immediately executed
     * by any idle worker thread; if all of them are active, a new thread will
     * be created to execute this task.
     */
    IMMEDIATE
  }

  /**
   * Default timeout configurations for use with the {@link PriorityAggregator}.
   */
  export enum Timeout {
    /**
     * A special timeout value to indicate that this task or request can run
     * indefinitely.
     */
    NONE = -1,

    /**
     * A special timeout value to indicate that the corresponding service's
     * default timeout value should be used.
     */
    DEFAULT
  }

  function aggregatorName (name: string): string {
    return 'aggregator.' + name
  }
}

/**
 * Simple Aggregator DSL.
 *
 * @remarks
 * The methods in this class are for the most part simple factory methods for
 * various {@link EntryAggregator} classes, but in some cases provide additional type
 * safety. They also tend to make the code more readable, especially if imported
 * statically, so their use is strongly encouraged in lieu of direct construction
 * of {@link EntryAggregator} classes.
 */
export class Aggregators {

  /**
   * Return an aggregator that calculates a average of the numeric values extracted
   * from a set of entries in a Map.
   *
   * @typeParam K  the type of the entry's key
   * @typeParam V  the type of the entry's value
   *
   * @param extractorOrProperty  the extractor or method/property name to provide values for aggregation
   *
   * @return an aggregator that calculates a average of the numeric values extracted
   *         from a set of entries in a Map
   */
  static average<K = any, V = any> (extractorOrProperty: extractor.ValueExtractor | string): aggregator.EntryAggregator<K, V, number> {
    return new aggregator.AverageAggregator(extractorOrProperty)
  }

  /**
   * Return an aggregator that calculates a number of values in an entry set.
   *
   * @typeParam K  the type of the entry's key
   * @typeParam V  the type of the entry's value
   *
   * @return an aggregator that calculates a number of values in an entry set
   */
  static count<K = any, V = any> (): aggregator.EntryAggregator<K, V, number> {
    return new aggregator.CountAggregator()
  }

  /**
   * Return an aggregator that calculates the set of distinct values from the entries in a Map.
   *
   * @param extractorOrProperty  the extractor or method/property name to provide values for aggregation
   *
   * @return an aggregator that calculates the set of distinct values from the entries in a Map
   */
  static distinct<K = any, V = any> (extractorOrProperty: extractor.ValueExtractor | string): aggregator.EntryAggregator<K, V, number> {
    return new aggregator.DistinctValuesAggregator(extractorOrProperty)
  }

  /**
   * Return a {@link GroupAggregator} based on a specified property or method name(s)
   * and an {@link EntryAggregator}.
   *
   * @typeParam K  the type of the Map entry keys
   * @typeParam V  the type of the Map entry values
   * @typeParam T  the type of the value to extract from
   * @typeParam E  the type of the extracted value
   * @typeParam R  the type of the group aggregator result
   *
   * @param extractorOrProperty  the extractor or method/property name to provide values for aggregation
   * @param agg                  an underlying {@link EntryAggregator}
   * @param filter               an optional {@link Filter} object used to filter out results
   *                             of individual group aggregation results
   *
   * @return a new {@link GroupAggregator}
   */
  static groupBy<K = any, V = any, T = any, E = any, R = any> (extractorOrProperty: extractor.ValueExtractor | string, agg: aggregator.EntryAggregator<K, V, T>, filter: filter.Filter): aggregator.EntryAggregator<K, V, Map<E, R>> {
    return new aggregator.GroupAggregator(extractorOrProperty, agg, filter)
  }

  /**
   * Return an aggregator that calculates a minimum of the numeric values extracted
   * from a set of entries in a Map.
   *
   * @typeParam K  the type of the entry's key
   * @typeParam V  the type of the entry's value
   *
   * @param extractorOrProperty  the extractor or method/property name to provide values for aggregation
   *
   * @return an aggregator that calculates a minimum of the numeric values extracted
   *         from a set of entries in a Map
   */
  static min<K = any, V = any> (extractorOrProperty: extractor.ValueExtractor | string): aggregator.EntryAggregator<K, V, number> {
    return new aggregator.MinAggregator(extractorOrProperty)
  }

  /**
   * Return an aggregator that calculates a maximum of the numeric values extracted
   * from a set of entries in a Map.
   *
   * @param extractorOrProperty  the extractor or method/property name to provide values for aggregation
   *
   * @return an aggregator that calculates a maximum of the numeric values extracted
   *         from a set of entries in a Map
   */
  static max (extractorOrProperty: extractor.ValueExtractor | string): aggregator.MaxAggregator {
    return new aggregator.MaxAggregator(extractorOrProperty)
  }

  /**
   * Return a new {@link PriorityAggregator} to control scheduling priority of an aggregation
   * operation.
   *
   * @typeParam K  the type of the Map entry keys
   * @typeParam V  the type of the Map entry values
   * @typeParam R  the type of the final result
   *
   * @param agg                 the underlying {@link EntryAggregator}
   * @param schedulingPriority  the {@link Schedule} priority
   * @param executionTimeout    the execution {@link Timeout}
   * @param requestTimeout      the request {@link Timeout}
   */
  static priority<K = any, V = any, R = any> (agg: aggregator.EntryAggregator<K, V, R>, schedulingPriority: aggregator.Schedule = aggregator.Schedule.STANDARD,
                                              executionTimeout: number = aggregator.Timeout.DEFAULT, requestTimeout: number = aggregator.Timeout.DEFAULT): aggregator.PriorityAggregator<K, V, R> {
    const priorityAgg = new aggregator.PriorityAggregator(agg)
    priorityAgg.executionTimeoutInMillis = executionTimeout
    priorityAgg.requestTimeoutInMillis = requestTimeout
    priorityAgg.schedulingPriority = schedulingPriority
    return priorityAgg
  }

  /**
   * Returns a new {@link QueryRecorder} aggregator which may be used is used to produce an object that
   * contains an estimated or actual cost of the query execution for a given {@link Filter}.
   *
   * @typeParam K  the type of the Map entry keys
   * @typeParam V  the type of the Map entry values
   *
   * @param type the {@link RecordType}
   *
   * @return a new {@link QueryRecorder} aggregator which may be used is used to produce an object that
   *         contains an estimated or actual cost of the query execution for a given {@link Filter}
   */
  static record<K = any, V = any> (type: aggregator.RecordType = aggregator.RecordType.EXPLAIN): aggregator.QueryRecorder<K, V> {
    return new aggregator.QueryRecorder<K, V>(type)
  }

  /**
   * Return an aggregator that will return the extracted value for each entry in the map.
   *
   * @typeParam K  the type of the Map entry keys
   * @typeParam V  the type of the Map entry values
   * @typeParam E  extracted value type
   * @typeParam R  the type of the group aggregator result
   *
   * @param extractorOrProperty  the extractor or method/property name to provide values for aggregation
   */
  static reduce<K = any, V = any, E = any, R = any> (extractorOrProperty: extractor.ValueExtractor | string): aggregator.ReducerAggregator<K, V, Map<K, E>> {
    return new aggregator.ReducerAggregator<K, V, E>(extractorOrProperty)
  }

  /**
   * Return an aggregator that is implemented in a script using the specified
   * language.
   *
   * @typeParam K  the type of the Map entry keys
   * @typeParam V  the type of the Map entry values
   * @typeParam R  the type of the group aggregator result
   *
   * @param language  the string specifying one of the supported languages
   * @param name      the aggregator name
   * @param args      arguments to pass to the aggregator
   *
   * @return an aggregator that is implemented in a script using the specified
   *         language
   */
  static script<K = any, V = any, R = any> (language: string, name: string, args: any[]): aggregator.ScriptAggregator<K, V, R> {
    return new aggregator.ScriptAggregator<K, V, R>(language, name, args)
  }

  /**
   * Return an aggregator that calculates a sum of the numeric values extracted
   * from a set of entries in a Map.
   *
   * @param extractorOrProperty  the extractor or method/property name to provide values for aggregation
   *
   * @return an aggregator that calculates a sum of the numeric values extracted
   *         from a set of entries in a Map
   */
  static sum (extractorOrProperty: extractor.ValueExtractor | string): aggregator.SumAggregator {
    return new aggregator.SumAggregator(extractorOrProperty)
  }

  /**
   * Return an aggregator that aggregates the top *N* extracted values into an array.
   *
   * @param count  the maximum number of results to include in the aggregation result
   */
  static top<K, V, R> (count: number): aggregator.TopAggregator<K, V, R> {
    return new aggregator.TopAggregator<K, V, R>(count)
  }
}
