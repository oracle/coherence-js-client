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
 * TODO (docs)
 */
export class PriorityAggregator<K, V, R>
  extends EntryAggregator<K, V, any, any, R> {

  protected aggregator: EntryAggregator<K, V, any, any, R>
  private _schedulingPriority: number = Schedule.STANDARD
  private _executionTimeout: number = Timeout.DEFAULT
  private _requestTimeout: number = Timeout.DEFAULT

  constructor (aggregator: EntryAggregator<K, V, any, any, R>) {
    super(internal.aggregatorName('PriorityAggregator'))
    this.aggregator = aggregator
  }

  get schedulingPriority (): number {
    return this._schedulingPriority
  }

  set schedulingPriority (value: number) {
    this._schedulingPriority = value
  }

  get executionTimeout (): number {
    return this._executionTimeout
  }

  set executionTimeout (value: number) {
    this._executionTimeout = value
  }

  get requestTimeout (): number {
    return this._requestTimeout
  }

  set requestTimeout (value: number) {
    this._requestTimeout = value
  }
}

export enum Schedule {
  STANDARD,
  FIRST,
  IMMEDIATE
}

export enum Timeout {
  NONE = -1,
  DEFAULT
}