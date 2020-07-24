/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { EntryProcessor } from '.'
import { internal } from './package-internal'

/**
 * Script is an entry processor that performs a remove
 * operation if the specified condition is satisfied.
 *
 */
export class ScriptProcessor<K, V>
  extends EntryProcessor<K, V, V> {
  /**
   * The script name.
   */
  script: string

  /**
   * The args for the script.
   */
  args: any[]

  /**
   * Construct a Script EntryProcessor.
   *
   * @param args  The args for the script.
   */
  constructor (script: string, ...args: any[]) {
    super(internal.processorName('Script'))
    this.script = script
    this.args = args
  }
}
