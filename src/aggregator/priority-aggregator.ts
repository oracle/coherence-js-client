/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { AbstractComparableAggregator, EntryAggregator } from '.'
import { ValueExtractor } from '../extractor/'
import { internal } from './package-internal'

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
 * @typeParam P  the type of the partial result
 * @typeParam R  the type of the final result
 */
export class PriorityAggregator<K, V, R>
  extends EntryAggregator<K, V, any, any, R> {

  /**
   * The wrapped {@link EntryAggregator}.
   */
  protected aggregator: EntryAggregator<K, V, any, any, R>

  /**
   * The scheduling priority.
   */
  private _schedulingPriority: Schedule = Schedule.STANDARD

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
  constructor (aggregator: EntryAggregator<K, V, any, any, R>) {
    super(internal.aggregatorName('PriorityAggregator'))
    this.aggregator = aggregator
  }

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