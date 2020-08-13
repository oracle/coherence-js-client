/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { EntryProcessor } from '.'
import { internal } from './package-internal'

/**
 * ScriptProcessor wraps a script written in one of the languages supported by Graal VM.
 *
 * @typeParam K  the type of the Map entry key
 * @typeParam V  the type of the Map entry value
 * @typeParma R  the type of value returned by the processor
 */
export class ScriptProcessor<K, V, R>
  extends EntryProcessor<K, V, R> {
  /**
   * The script name.
   */
  protected readonly name: string

  /**
   * The scripting language identifier.
   */
  protected readonly language: string

  /**
   * The arguments to pass to the script
   */
  protected args: any[]

  /**
   * Create a {@link ScriptProcessor} that wraps a script written in the
   * specified language and identified by the specified name. The specified
   * args will be passed during execution of the script.
   *
   * @param language  the language the script is written. Currently, only
   *                  `js` (for JavaScript) is supported
   * @param name      the name of the {@link EntryProcessor} that needs to
   *                  be executed
   * @param args      the arguments to be passed to the {@link EntryProcessor}
   *
   */
  constructor (language: string, name: string, args?: any[]) {
    super(internal.processorName('ScriptProcessor'))
    this.language = language
    this.name = name
    this.args = args ? args : new Array<any>()
  }
}
