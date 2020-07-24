/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */


import { internal } from './package-internal'
import { EntryProcessor } from '.'

/**
 * An entry processor that invokes the specified method on a value
 * of a cache entry and optionally updates the entry with a
 * modified value.
 */
export class MethodInvocationProcessor<K = any, V = any, R = any>
  extends EntryProcessor<K, V, R> {
  /**
   * The Method name.
   */
  methodName: string

  /**
   * The args for the MethodInvocation.
   */
  args: Array<any>

  /**
   * A flag specifying whether the method mutates the state of a target object.
   */
  mutator: boolean

  /**
   * Construct a MethodInvocation EntryProcessor.
   *
   * @param args  The args for the MethodInvocation.
   */
  constructor (methodName: string, mutator: boolean, args: any[]) {
    super(internal.processorName('MethodInvocationProcessor'))
    this.methodName = methodName
    this.mutator = mutator
    this.args = args
  }
}
