/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { EntryAggregator } from '.'
import { internal } from './package-internal'

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
export class QueryRecorder<K, V>
  extends EntryAggregator<K, V, any, any, any> {

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
    super(internal.aggregatorName('QueryRecorder'))
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