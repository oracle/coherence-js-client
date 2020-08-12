/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { EntryAggregator } from '.'
import { internal } from './package-internal'

/**
 * ScriptAggregator is a {@link EntryAggregator} that wraps a script written
 * in one of the languages supported by Graal VM.
 *
 * @typeParam K  the type of the Map entry keys
 * @typeParam V  the type of the Map entry values
 * @typeParam P  the type of the partial result
 * @typeParam R  the type of the final result
 *
 * @author mk 2019.09.24
 * @since 14.1.1.0
 */
export class ScriptAggregator<K, V, T, R>
  extends EntryAggregator<K, V, T, any, R> {

  /**
   * The language with which the script is written in.
   */
  protected language: string

  /**
   * The name of the {@link Filter} that needs to be evaluated.
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
    super(internal.aggregatorName('ScriptAggregator'))
    if (language !== 'js') {
      throw new Error('Javascript is currently the only supported language')
    }
    this.language = language
    this.name = name
    this.args = args ? args : new Array<any>()
    this.characteristics = 0
  }
}