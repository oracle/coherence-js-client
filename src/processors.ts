/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ValueUpdater } from './extractor'
import { Filter } from './filter/'
import {
  ConditionalPutAll,
  ConditionalPut,
  ConditionalRemove,
  EntryProcessor,
  ExtractorProcessor,
  MethodInvocationProcessor,
  NullProcessor,
  NumberIncrementor,
  NumberMultiplier,
  PreloadRequest,
  PutIfAbsent,
  TouchProcessor,
  UpdaterProcessor,
  VersionedPutAll,
  VersionedPut, ValueManipulator, ScriptProcessor
} from './processor'
import { Map } from './util'

export class Processors {

  /**
   * Construct a {@link ConditionalPut} that updates an entry with a new value if
   * and only if the filter applied to the entry evaluates to `true`. This
   * processor optionally returns the current value as a result of the
   * invocation if it has not been updated (the filter evaluated to `false`).
   *
   * @typeParam V  the type of the Map entry value
   *
   * @param filter       the filter to evaluate an entry
   * @param value        a value to update an entry with
   * @param returnValue  specifies whether or not the processor should return
   *                     the current value in case it has not been updated
   *
   * @return a put processor that updates an entry with a new value if
   *         and only if the filter applied to the entry evaluates to `true`.
   */
  static conditionalPut<K, V> (filter: Filter<V>, value: V, returnValue?: boolean): ConditionalPut<K, V> {
    return new ConditionalPut(filter, value, returnValue)
  }

  /**
   * Construct a {@link ConditionalPutAll} that updates an entry with a
   * new value if and only if the filter applied to the entry evaluates to
   * `true`. The new value is extracted from the specified map based on the
   * entry's key.
   *
   * @typeParam K  the type of the Map entry key
   * @typeParam V  the type of the Map entry value
   *
   * @param filter  the filter to evaluate all supplied entries
   * @param map     a map of values to update entries with
   *
   * @return a {@link ConditionalPutAll}  processor that updates an entry with a new value
   *         if and only if the filter applied to the entry evaluates to
   *         `true`.
   */
  static conditionalPutAll<K, V> (filter: Filter<V>, map: Map<K, V>): ConditionalPutAll<K, V> {
    return new ConditionalPutAll(filter, map)
  }

  /**
   * Construct a {@link ConditionalRemove} processor that removes an InvocableMap
   * entry if and only if the filter applied to the entry evaluates to `true`.
   * This processor may optionally return the current value as a result of
   * the invocation if it has not been removed (the filter evaluated to
   * `false`).
   *
   * @param filter       the filter to evaluate an entry
   * @param returnValue  specifies whether or not the processor should return
   *                     the current value if it has not been removed
   *
   * @return a remove processor that removes an InvocableMap entry
   *         if and only if the filter applied to the entry evaluates to `true`.
   */
  static conditionalRemove<K, V> (filter: Filter<V>, returnValue?: boolean): ConditionalRemove<K, V> {
    return new ConditionalRemove(filter, returnValue)
  }

  /**
   * Construct an extract processor based on the specified {@link ValueExtractor}.
   *
   * @typeParam K  the type of the Map entry keys
   * @typeParam V  the type of the Map entry values
   * @typeParam R  the type of the extracted value
   *
   * @param extractorOrFieldName  a Extractor object; passing null is equivalent
   *                              to using the {@link IdentityExtractor} or the property
   *                              or method name to invoke to provide a value
   *
   * @return an extract processor based on the specified extractor.
   *
   * @see ExtractorProcessor
   */
  static extract<K, V, R> (extractorOrFieldName?: string): EntryProcessor<K, V, R> {
    return new ExtractorProcessor(extractorOrFieldName)
  }

  /**
   * Construct an increment processor that will increment a property
   * value by a specified amount, returning either the old or the new value
   * as specified.
   *
   * @typeParam K  the type of the Map entry keys
   * @typeParam V  the type of the Map entry values
   *
   * @param propertyOrManipulator  the Manipulator or property to manipulate
   * @param value                  the Number representing the magnitude and sign of
   *                               the increment
   * @param returnOldValue         pass `true` to return the value as it was before
   *                               it was incremented, or pass` false` to return the
   *                               value as it is after it is incremented
   *
   * @return an increment processor
   */
  static increment<K, V> (propertyOrManipulator: ValueManipulator<V, number> | string, value: number, returnOldValue: boolean = false): NumberIncrementor<K, V> {
    return new NumberIncrementor(propertyOrManipulator, value, returnOldValue)
  }

  /**
   * Construct {@link MethodInvocationProcessor} appropriate for invoking an accessor.
   *
   * @typeParam K  the type of the Map entry keys
   * @typeParam V  the type of the Map entry values
   * @typeParam R  the type of the extracted value
   *
   * @param methodName  the name of the method to invoke
   * @param args        the method arguments
   */
  static invokeAccessor<K, V, R> (methodName: string, ...args: any[]): EntryProcessor<K, V, R> {
    return new MethodInvocationProcessor(methodName, false, args)
  }

  /**
   * Construct {@link MethodInvocationProcessor} appropriate for invoking a mutating method.
   *
   * @typeParam K  the type of the Map entry keys
   * @typeParam V  the type of the Map entry values
   * @typeParam R  the type of the extracted value
   *
   * @param methodName  the name of the method to invoke
   * @param args        the method arguments
   */
  static invokeMutator<K, V, R> (methodName: string, ...args: any[]): EntryProcessor<K, V, R> {
    return new MethodInvocationProcessor(methodName, true, args)
  }

  /**
   * Construct a {@link NumberMultiplier} processor that will multiply a property
   * value by a specified factor, returning either the old or the new value
   * as specified.
   *
   * @typeParam K  the type of the Map entry keys
   * @typeParam V  the type of the Map entry values
   *
   * @param propertyOrManipulator  the Manipulator or property to manipulate
   * @param numFactor              the Number representing the magnitude and sign of
   *                               the multiplier
   * @param returnOldValue         pass `true` to return the value as it was before
   *                               it was multiplied, or pass `false` to return the
   *                               value as it is after it is multiplied
   *
   * @return a multiply processor that will multiply a property value
   *         by a specified factor, returning either the old or the
   *         new value as specified
   */
  static multiply<K, V> (propertyOrManipulator: string, numFactor: number, returnOldValue: boolean = false): NumberMultiplier<K, V> {
    return new NumberMultiplier(propertyOrManipulator, numFactor, returnOldValue)
  }

  /**
   * Return an {@link EntryProcessor} that does nothing and returns `true` as a result of execution.
   *
   * @typeParam K  the type of the Map entry keys
   * @typeParam V  the type of the Map entry values
   *
   * @return an {@link EntryProcessor} that does nothing and returns `true` as a result of execution
   */
  static nop<K, V> (): EntryProcessor<K, V> {
    return NullProcessor.INSTANCE
  }

  /**
   * Constructs a new {@link PutIfAbsent} processor.
   *
   * @typeParam K  the type of the Map entry keys
   * @typeParam V  the type of the Map entry values
   *
   * @param value  the value to insert if not already present
   *
   * @return a new {@link PutIfAbsent} processor
   */
  static putIfAbsent<K, V> (value: V): EntryProcessor<K, V> {
    return new PutIfAbsent(value)
  }

  /**
   * Construct an update processor for a given method name. The method
   * must have a single parameter of a Java type compatible with the
   * specified value type.
   *
   * @typeParam K  the type of the Map entry key
   * @typeParam V  the type of the Map entry value
   * @typeParam T  the return type of the `ValueUpdater`
   *
   * @param propertyOrUpdater  a ValueUpdater object the property or method name to invoke to provide a value
   * @param value             the value to update the target entry with
   *
   * @return an update processor for a given method name
   */
  static update<K, V, T> (propertyOrUpdater: string | ValueUpdater<V, T>, value: T): UpdaterProcessor<K, V, T> {
    if (typeof propertyOrUpdater === 'string') {
      return new UpdaterProcessor<K, V, T>(propertyOrUpdater, value)
    } else {
      return new UpdaterProcessor<K, V, T>(propertyOrUpdater, value)
    }
  }

  /**
   * Construct a {@link VersionedPut} processor that updates an entry with
   * a new value if and only if the version of the new value matches
   * to the version of the current entry's value. This processor
   * optionally returns the current value as a result of the invocation
   * if it has not been updated (the versions did not match).
   *
   * @typeParam K  the type of the Map entry key
   * @typeParam V  the type of the Map entry value
   *
   * @param value          a value to update an entry with
   * @param allowInsert    specifies whether or not an insert should be
   *                       allowed (no currently existing value)
   * @param returnCurrent  specifies whether or not the processor should
   *                       return the current value in case it has not been
   *                       updated
   */
  static versionedPut<K, V> (value: V, allowInsert: boolean = false, returnCurrent: boolean = false): VersionedPut<K, V> {
    return new VersionedPut(value, allowInsert, returnCurrent)
  }

  /**
   * Construct a {@link VersionedPutAll} processor that updates an entry with a new
   * value if and only if the version of the new value matches to the
   * version of the current entry's value (which must exist). This processor
   * optionally returns a map of entries that have not been updated (the
   * versions did not match).
   *
   * @typeParam K  the type of the Map entry key
   * @typeParam V  the type of the Map entry value
   *
   * @param map            a map of values to update entries with
   * @param allowInsert    specifies whether or not an insert should be
   *                       allowed (no currently existing value)
   * @param returnCurrent  specifies whether or not the processor should
   *                       return the entries that have not been updated
   *
   * @return a {@link VersionedPutAll} processor
   */
  static versionedPutAll<K, V> (map: Map<K, V>, allowInsert: boolean = false, returnCurrent: boolean = false): VersionedPutAll<K, V> {
    return new VersionedPutAll(map, allowInsert, returnCurrent)
  }

  /**
   * Construct the preload request processor.
   *
   * @typeParam K  the type of the Map entry key
   * @typeParam V  the type of the Map entry value
   *
   * @return a preload request processor
   */
  static preload<K, V> (): PreloadRequest<K, V> {
    return new PreloadRequest()
  }

  /**
   * Return a new {@link ScriptProcessor}.
   *
   * @typeParam K  the type of the Map entry key
   * @typeParam V  the type of the Map entry value
   *
   * @param language  the language the script is written. Currently, only
   *                  `js` (for JavaScript) is supported
   * @param name      the name of the {@link EntryProcessor} that needs to
   *                  be executed
   * @param args      the arguments to be passed to the {@link EntryProcessor}
   *
   * @return a new  {@link ScriptProcessor}
   */
  static script<K, V, R> (language: string, name: string, ...args: any[]): ScriptProcessor<K, V, R> {
    return new ScriptProcessor(language, name, args)
  }

  /**
   * Constructs a {@link TouchProcessor} that `touches` an entry (if present) in order to
   * trigger interceptor re-evaluation and possibly increment expiry time.
   *
   * @typeParam K  the type of the Map entry keys
   * @typeParam V  the type of the Map entry values
   *
   * @return a new {@link TouchProcessor}
   */
  static touch<K, V> (): TouchProcessor<K, V> {
    return new TouchProcessor()
  }
}
