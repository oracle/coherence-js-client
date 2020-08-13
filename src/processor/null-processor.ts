/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */


import { internal } from './package-internal'
import { EntryProcessor } from '.'

/**
 * Put entry processor.
 *
 * An implementation of an EntryProcessor that does nothing and returns
 * `true` as a result of execution.
 */
export class NullProcessor
  extends EntryProcessor<any, any, void> {
  /**
   * Singleton `NullProcessor` instance.
   */
  static readonly INSTANCE: NullProcessor = new NullProcessor();

  /**
   * Construct a Null EntryProcessor.
   */
  protected constructor () {
    super(internal.processorName('NullEntryProcessor'))
  }
}
