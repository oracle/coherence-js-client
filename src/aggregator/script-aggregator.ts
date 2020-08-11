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
export class ScriptAggregator<K, V, T, R>
  extends EntryAggregator<K, V, T, any, R> {

  protected language: string
  protected name: string
  protected args: [object]

  constructor (language: string, name: string, args: [any]) {
    super(internal.aggregatorName('ScriptAggregator'))
    this.language = language
    this.name = name
    this.args = args
  }
}