/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { EntryAggregator } from '.'
import { internal } from './package-internal'

/**
 * TODO (docs)
 */
export class QueryRecorder<K, V>
  extends EntryAggregator<K, V, any, any, any> {

  static readonly EXPLAIN: string = 'EXPLAIN'
  static readonly TRACE: string = 'TRACE'

  protected readonly type: object

  constructor (type: RecordType) {
    super(internal.aggregatorName('QueryRecorder'))
    this.type = QueryRecorder.getType(type)
  }

  private static getType(type: RecordType): object {
    switch (type) {
      case RecordType.EXPLAIN:
        return {enum: this.EXPLAIN}
      case RecordType.TRACE:
        return {enum: this.TRACE}
    }
  }
}

export enum RecordType {
  EXPLAIN,
  TRACE
}