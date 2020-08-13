/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { CompositeUpdater, UniversalUpdater, ValueUpdater } from '../extractor/'
import { EntryProcessor } from '.'
import { internal } from './package-internal'

/**
 * UpdaterProcessor is an EntryProcessor implementations that updates an
 * attribute of an object cached in an InvocableMap.
 *
 * While it's possible to update a value via standard Map API, using the updater allows for clustered
 * caches using the UpdaterProcessor allows avoiding explicit concurrency control and could significantly reduce
 * the amount of network traffic.
 */
export class UpdaterProcessor<K = any, V = any, T = any>
  extends EntryProcessor<K, V, boolean> {
  /**
   * The underlying ValueUpdater.
   */
  protected readonly updater: ValueUpdater<V, T> | null

  /**
   * A value to update the entry's value with.
   */
  protected readonly value: T

  /**
   * Construct an `UpdaterProcessor` based on the specified ValueUpdater.
   *
   * @typeParam K  the type of the Map entry key
   * @typeParam V  the type of the Map entry value
   * @typeParam T  the return type of the `ValueUpdater`
   *
   * @param updaterOrPropertyName  a ValueUpdater object or the method name; passing null will simpy replace
   *                               the entry's value with the specified one instead of
   *                               updating it
   * @param value                  the value to update the target entry with
   */
  constructor (updaterOrPropertyName: string | ValueUpdater<V, T> | null, value: T) {
    super(internal.processorName('UpdaterProcessor'))
    if (typeof updaterOrPropertyName === 'string') {
      const methodName = updaterOrPropertyName
      this.updater = (methodName.indexOf('.') < 0)
        ? new UniversalUpdater(methodName)
        : new CompositeUpdater(methodName)
    } else {
      this.updater = updaterOrPropertyName
    }
    this.value = value
  }
}
