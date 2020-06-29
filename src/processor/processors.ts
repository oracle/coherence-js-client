/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { Filter } from '../filter/filter'
import { ValueUpdater } from '../util/value_updater'
import { ConditionalPutAllProcessor } from './conditional_put_all_processor'
import { ConditionalPutProcessor } from './conditional_put_processor'
import { ConditionalRemoveProcessor } from './conditional_remove_processor'
import { EntryProcessor } from './entry_processor'
import { ExtractorProcessor } from './extractor_processor'
import { GetOrDefaultProcessor } from './get_or_default_processor'
import { GetProcessor } from './get_processor'
import { MethodInvocationProcessor } from './method_invocation_processor'
import { NullProcessor } from './null_processor'
import { NumberIncrementor } from './number_incrementor'
import { NumberMultiplier } from './number_multiplier'
import { PreloadRequestProcessor } from './preload_request_processor'
import { PutAllProcessor } from './put_all_processor'
import { PutIfAbsentProcessor } from './put_if_absent_processor'
import { PutProcessor } from './put_processor'
import { RemoveBlindProcessor } from './remove_blind_processor'
import { RemoveProcessor } from './remove_processor'
import { RemoveValueProcessor } from './remove_value_processor'
import { ReplaceProcessor } from './replace_processor'
import { ReplaceValueProcessor } from './replace_value_processor'
import { TouchProcessor } from './touch_processor'
import { UpdaterProcessor } from './updater_processor'
import { VersionedPutAllProcessor } from './versioned_put_all_processor'
import { VersionedPutProcessor } from './versioned_put_processor'

export class Processors {
  static conditionalPut<K, V> (filter: Filter<V>, value: V, returnValue?: boolean): ConditionalPutProcessor<K, V> {
    return new ConditionalPutProcessor(filter, value, returnValue)
  }

  static conditionalPutAll<K, V> (filter: Filter<V>, values: Map<K, V>): ConditionalPutAllProcessor<K, V> {
    return new ConditionalPutAllProcessor(filter, values)
  }

  static conditionalRemove<K, V> (filter: Filter<V>): ConditionalRemoveProcessor<K, V> {
    return new ConditionalRemoveProcessor(filter)
  }

  static extract<K, V, R> (fieldName?: string): EntryProcessor<K, V, R> {
    return new ExtractorProcessor(fieldName)
  }

  static get<K, V> (): EntryProcessor<K, V> {
    return new GetProcessor()
  }

  // ?? Optional<V>
  static getOrDefault<K, V> (): EntryProcessor<K, V> {
    return new GetOrDefaultProcessor()
  }

  static increment<K, V> (property: string, value: number, returnOldValue: boolean = true): NumberIncrementor<K, V> {
    return new NumberIncrementor(property, value, returnOldValue)
  }

  static invokeAccessor<K, V, R> (method: string, ...args: any[]): EntryProcessor<K, V, R> {
    return new MethodInvocationProcessor(method, false, args)
  }

  static invokeMutator<K, V, R> (method: string, ...args: any[]): EntryProcessor<K, V, R> {
    return new MethodInvocationProcessor(method, true, args)
  }

  static multiply<K, V> (property: string, value: number, returnOldValue: boolean = true): NumberMultiplier<K, V> {
    return new NumberMultiplier(property, value, returnOldValue)
  }

  static nop<K, V> (): EntryProcessor<K, V> {
    return new NullProcessor()
  }

  static put<K, V> (value: V, ttl?: number): EntryProcessor<K, V> {
    return new PutProcessor(value, ttl)
  }

  static putAll<K, V, P extends K, Q extends V> (entries: Map<P, Q>): EntryProcessor<K, V> {
    return new PutAllProcessor(entries)
  }

  static putIfAbsent<K, V> (value: V): EntryProcessor<K, V> {
    return new PutIfAbsentProcessor(value)
  }

  static remove<K, V> (): EntryProcessor<K, V>;
  static remove<K, V> (value: V): EntryProcessor<K, V>;
  static remove<K, V> (value?: V): EntryProcessor<K, V> {
    return value ? new RemoveValueProcessor(value) : new RemoveProcessor()
  }

  static removeBlind<K, V> (): EntryProcessor<K, V> {
    return new RemoveBlindProcessor()
  }

  static replace<K, V> (value: V): EntryProcessor<K, V>;
  static replace<K, V> (oldValue: V, newValue: V): EntryProcessor<K, V>;
  static replace<K, V> (value: V, newValue?: V): EntryProcessor<K, V> {
    return newValue ? new ReplaceValueProcessor(value, newValue) : new ReplaceProcessor(value)
  }

  static update<K, V, T> (property: string, value: T): UpdaterProcessor<K, V, T>;
  static update<K, V, T> (updater: ValueUpdater<V, T>, value: T): UpdaterProcessor<K, V, T>;
  static update<K, V, T> (propertyOrUpdater: string | ValueUpdater<V, T>, value: T): UpdaterProcessor<K, V, T> {
    if (typeof propertyOrUpdater === 'string') {
      return new UpdaterProcessor<K, V, T>(propertyOrUpdater, value)
    } else {
      return new UpdaterProcessor<K, V, T>(propertyOrUpdater, value)
    }
  }

  static versionedPut<K, V> (value: V): VersionedPutProcessor<K, V>;
  static versionedPut<K, V> (value: V, allowInsert: boolean): VersionedPutProcessor<K, V>;
  static versionedPut<K, V> (value: V, allowInsert: boolean, returnCurrent: boolean): VersionedPutProcessor<K, V>;
  static versionedPut<K, V> (value: V, allowInsert: boolean = false, returnCurrent: boolean = false): VersionedPutProcessor<K, V> {
    return new VersionedPutProcessor(value, allowInsert, returnCurrent)
  }

  static versionedPutAll<K, V> (entries: Map<K, V>): VersionedPutAllProcessor<K, V>;
  static versionedPutAll<K, V> (entries: Map<K, V>, allowInsert: boolean): VersionedPutAllProcessor<K, V>;
  static versionedPutAll<K, V> (entries: Map<K, V>, allowInsert: boolean, returnCurrent: boolean): VersionedPutAllProcessor<K, V>;
  static versionedPutAll<K, V> (entries: Map<K, V>, allowInsert: boolean = false, returnCurrent: boolean = false): VersionedPutAllProcessor<K, V> {
    return new VersionedPutAllProcessor(entries, allowInsert, returnCurrent)
  }

  static preload<K, V> (): PreloadRequestProcessor<K, V> {
    return new PreloadRequestProcessor()
  }

  static script<K, V> (script: string, ...args: any[]): TouchProcessor<K, V> {
    return new TouchProcessor()
  }

  static touch<K, V> (): TouchProcessor<K, V> {
    return new TouchProcessor()
  }
}
