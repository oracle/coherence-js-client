/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { extractor } from './extractors'
import { filter } from './filters'

export namespace processor {

  /**
   * An invocable agent that operates against the entries within a NamedMap.
   *
   * @typeParam K  the type of the Map entry key
   * @typeParam V  the type of the Map entry value
   * @typeParam R  the type of value returned by the EntryProcessor
   */
  export abstract class EntryProcessor<K = any, V = any, R = any>
    implements EntryProcessor<K, V, R> {
    '@class': string

    /**
     * Constructs a new `EntryProcessor`.
     *
     * @param clz  Server-side `EntryProcessor` implementation type identifier.
     */
    protected constructor (clz: string) {
      this['@class'] = clz
    }

    /**
     * Returns a {@link CompositeProcessor} comprised of this and the provided processor.
     *
     * @param processor  the next processor
     *
     * @return a {@link CompositeProcessor} comprised of this and the provided processor
     */
    andThen (processor: EntryProcessor<K, V>): CompositeProcessor<K, V> {
      return new CompositeProcessor(this, processor)
    }

    /**
     * Returns a {@link ConditionalProcessor} comprised of this processor and the provided filter.
     *
     * The specified entry processor gets invoked if and only if the filter
     * applied to the entry evaluates to `true`; otherwise the
     * result of the invocation will return `null`.
     *
     * @param filter  the filter
     */
    when (filter: filter.Filter): EntryProcessor<K, V, R> {
      return new ConditionalProcessor(filter, this)
    }
  }

  /**
   * ConditionalProcessor` represents a processor that is invoked
   * conditionally based on the result of an entry evaluation.  A
   * `ConditionalProcessor` is returned from the `when()` function, which
   * takes a filter as its argument.
   *
   * @typeParam K  the type of the Map entry key
   * @typeParam V  the type of the Map entry value
   * @typeParam R  the type of value returned by the EntryProcessor
   */
  export class ConditionalProcessor<K = any, V = any, R = any>
    extends EntryProcessor<K, V, R> {

    /**
     * The underlying entry processor.
     */
    processor: EntryProcessor<K, V, R>
    /**
     * The underlying filter.
     */
    protected filter: filter.Filter

    /**
     * Construct a ConditionalProcessor for the specified filter and the
     * processor.
     *
     * The specified entry processor gets invoked if and only if the filter
     * applied to the cache entry evaluates to `true`; otherwise the
     * result of the invocation will return `null`.
     *
     * @param filter     the filter
     * @param processor  the entry processor
     */
    constructor (filter: filter.Filter, processor: EntryProcessor<K, V, R>) {
      super(processorName('ConditionalProcessor'))
      this.filter = filter
      this.processor = processor
    }
  }

  /**
   * CompositeProcessor represents a collection of entry processors that are
   * invoked sequentially against the same MapEntry.
   *
   * @typeParam K  the type of the Map entry key
   * @typeParam V  the type of the Map entry value
   * @typeParam R  the type of value returned by the EntryProcessor
   */
  export class CompositeProcessor<K = any, V = any>
    extends EntryProcessor<K, V> {

    /**
     * The underlying entry processor array.
     */
    protected processors: Array<EntryProcessor<K, V>>

    /**
     * Construct a `CompositeProcessor` for the specified array of individual
     * entry processors.
     *
     * The result of the `CompositeProcessor` execution is an array of results
     * returned by the individual EntryProcessor invocations.
     *
     * @param processors  the entry processor array
     */
    constructor (...processors: EntryProcessor<K, V>[]) {
      super(processorName('CompositeProcessor'))
      this.processors = processors
    }

    /**
     * @inheritDoc
     */
    andThen (processor: EntryProcessor<K, V>): this {
      this.processors.push(processor)
      return this
    }
  }

  /**
   * `PropertyProcessor` is a base class for EntryProcessor implementations that
   * depend on a ValueManipulator.
   */
  export abstract class PropertyProcessor<K = any, V = any, R = any>
    extends EntryProcessor<K, V, R> {
    /**
     * The property value manipulator.
     */
    protected readonly manipulator: extractor.ValueManipulator

    /**
     * Construct a PropertyProcessor for the specified property name.
     * <p>
     * This constructor assumes that the corresponding property getter will
     * have a name of ("get" + sName) and the corresponding property setter's
     * name will be ("set + sName).
     *
     * @param typeName                   the server-side {@link ValueManipulator} type identifier
     * @param manipulatorOrPropertyName  the manipulator or property name
     * @param useIs                      prefix with `is`
     */
    protected constructor (typeName: string, manipulatorOrPropertyName: extractor.ValueManipulator | string, useIs: boolean = false) {
      super(typeName)
      this.manipulator = typeof manipulatorOrPropertyName === 'string'
        ? new PropertyManipulator(manipulatorOrPropertyName, useIs)
        : manipulatorOrPropertyName
    }
  }

  /**
   * `PropertyManipulator` is a reflection based ValueManipulator implementation
   * based on the JavaBean property name conventions.
   */
  export class PropertyManipulator
    implements extractor.ValueManipulator {
    /**
     * The getter prefix flag.
     */
    useIsPrefix: boolean
    /**
     * Server-side {@link PropertyManipulator} implementation type identifier
     */
    protected '@class': string
    /**
     * The property name, never `null`.
     */
    protected name: string

    /**
     * Construct a PropertyManipulator for the specified property name.
     * <p>
     * This constructor assumes that the corresponding property getter will
     * have a name of either ("get" + sName) or ("is + sName) and the
     * corresponding property setter's name will be ("set + sName).
     *
     * @param propertyName  a property name
     * @param useIs         if true, the getter method will be prefixed with "is"
     *                      rather than "get"
     */
    constructor (propertyName: string, useIs: boolean = false) {
      this['@class'] = processorName('PropertyManipulator')
      this.name = propertyName
      this.useIsPrefix = useIs
    }

    /**
     * @inheritDoc
     */
    getExtractor (): extractor.ValueExtractor {
      throw new Error('Method not implemented.')
    }

    /**
     * @inheritDoc
     */
    getUpdater (): extractor.ValueUpdater {
      throw new Error('Method not implemented.')
    }
  }

  /**
   * `ConditionalPut` is an EntryProcessor that performs an update operation for an entry
   * that satisfies the specified condition.
   *
   * While the `ConditionalPut` processing could be implemented via direct
   * key-based NamedMap operations, it is more efficient and enforces
   * concurrency control without explicit locking.
   *
   * Obviously, using more specific, fine-tuned filters (rather than ones based
   * on the IdentityExtractor) may provide additional flexibility and efficiency
   * allowing the put operation to be performed conditionally on values of
   * specific attributes (or even calculations) instead of the entire object.
   */
  export class ConditionalPut<K = any, V = any>
    extends EntryProcessor<K, V, V> {
    /**
     * The underlying filter.
     */
    protected readonly filter: filter.Filter

    /**
     * Specifies the new value to update an entry with.
     */
    protected readonly value: V

    /**
     * Specifies whether or not a return value is required.
     */
    protected 'return': boolean = true

    /**
     * Construct a ConditionalPut that updates an entry with a new value if
     * and only if the filter applied to the entry evaluates to true.
     * The result of the invocation does not return any result.
     *
     * @param filter       the filter to evaluate an entry
     * @param value        a value to update an entry with
     * @param returnValue  specifies whether or not the processor should return
     *                     the current value in case it has not been updated
     */
    constructor (filter: filter.Filter, value: V, returnValue?: boolean) {
      super(processorName('ConditionalPut'))

      this.filter = filter
      this.value = value
      this.return = returnValue || true
    }

    /**
     * If called, it will cause the processor to return the current value in case it
     * has not been updated.
     *
     * @param returnCurrent specifies whether or not the processor should return
     *                      the current value in case it has not been updated
     */
    returnCurrent (returnCurrent: boolean = true): this {
      this.return = returnCurrent
      return this
    }
  }

  /**
   * /**
   * ConditionalPutAll is an EntryProcessor that performs an update operation for multiple entries
   * that satisfy the specified condition.
   *
   * This allows for concurrent insertion/update of values within the cache.
   * For example a concurrent `replaceAll(map)` could be implemented as:
   * ```javascript
   *   filter = PresentFilter.INSTANCE;
   *   cache.invokeAll(map.keys(), new ConditionalPutAll(filter, map));
   * ```
   *
   * or `putAllIfAbsent` could be done by inverting the filter:
   * ```javascript
   *   filter = new NotFilter(PresentFilter.INSTANCE);
   * ```
   *
   * Obviously, using more specific, fine-tuned filters may provide additional
   * flexibility and efficiency allowing the multi-put operations to be
   * performed conditionally on values of specific attributes (or even
   * calculations) instead of a simple existence check.
   */
  export class ConditionalPutAll<K = any, V = any>
    extends EntryProcessor<K, V, V> {
    /**
     * The underlying filter.
     */
    filter: filter.Filter

    /**
     * Specifies the new value to update an entry with.
     */
    entries: MapHolder<K, V>

    /**
     * Construct a ConditionalPutAll processor that updates an entry with a
     * new value if and only if the filter applied to the entry evaluates to
     * true. The new value is extracted from the specified map based on the
     * entry's key.
     *
     * @param filter  the filter to evaluate all supplied entries
     * @param map     a map of values to update entries with
     */
    constructor (filter: filter.Filter, map: Map<K, V>) {
      super(processorName('ConditionalPutAll'))

      this.filter = filter
      this.entries = new MapHolder(map)
    }
  }

  /**
   * ConditionalRemove is an EntryProcessor that performs an
   * remove operation if the specified condition is satisfied.
   *
   * While the ConditionalRemove processing could be implemented via direct
   * key-based NamedMap operations, it is more efficient and enforces
   * concurrency control without explicit locking.
   */
  export class ConditionalRemove<K = any, V = any>
    extends EntryProcessor<K, V, V> {
    /**
     * The underlying filter.
     */
    protected readonly filter: filter.Filter

    /**
     * Specifies whether or not a return value is required.
     */
    protected 'return': boolean = true

    /**
     * Construct a ConditionalRemove processor that removes an NamedMap
     * entry if and only if the filter applied to the entry evaluates to `true`.
     * The result of the invocation does not return any result.
     *
     * @param filter       the filter to evaluate an entry
     * @param returnValue  specifies whether or not the processor should return
     *                     the current value if it has not been removed
     */
    constructor (filter: filter.Filter, returnValue?: boolean) {
      super(processorName('ConditionalRemove'))

      this.filter = filter
      this.return = this.return = returnValue || true
    }

    /**
     * If called, it will cause the processor to return the current value in case it
     * has not been updated.
     *
     * @param returnCurrent specifies whether or not the processor should return
     *                      the current value in case it has not been updated
     */
    returnCurrent (returnCurrent: boolean = true): this {
      this.return = returnCurrent
      return this
    }
  }

  /**
   * `ExtractorProcessor` is an {@link EntryProcessor} implementation that extracts a
   * value from an object cached a NamedMap. A common usage pattern is:
   * ```javascript
   *   cache.invoke(oKey, new ExtractorProcessor(extractor));
   * ```
   * For clustered caches using the ExtractorProcessor could significantly reduce the amount of network
   * traffic.
   */
  export class ExtractorProcessor
    extends EntryProcessor {

    /**
     * The underlying value extractor.
     */
    extractor: extractor.ValueExtractor

    /**
     * Construct an ExtractorProcessor using the given extractor or method name.
     *
     * @param extractorOrMethod  the extractor.ValueExtractor to use by this filter or the name of the method to
     *                           invoke via reflection
     */
    constructor (extractorOrMethod: extractor.ValueExtractor | string | undefined) {
      super(processorName('ExtractorProcessor'))
      if (extractorOrMethod instanceof extractor.ValueExtractor) {
        this.extractor = extractorOrMethod
      } else {
        if (!extractorOrMethod) {
          this.extractor = extractor.IdentityExtractor.INSTANCE
        } else {
          this.extractor = (extractorOrMethod.indexOf('.') < 0)
            ? new extractor.UniversalExtractor(extractorOrMethod)
            : new extractor.ChainedExtractor(extractorOrMethod)
        }
      }
    }
  }

  /**
   * An entry processor that invokes the specified method on a value
   * of a cache entry and optionally updates the entry with a
   * modified value.
   */
  export class MethodInvocationProcessor
    extends EntryProcessor {
    /**
     * The name of the method to invoke.
     */
    methodName: string

    /**
     * Method arguments.
     */
    args: Array<any>

    /**
     * A flag specifying whether the method mutates the state of a target object.
     */
    mutator: boolean

    /**
     * Construct MethodInvocationProcessor instance.
     *
     * @param methodName  the name of the method to invoke
     * @param mutator     the flag specifying whether the method mutates the
     *                     state of a target object, which implies that the
     *                     entry value should be updated after method invocation
     * @param args        the method arguments
     */
    constructor (methodName: string, mutator: boolean, args: any[] = []) {
      super(processorName('MethodInvocationProcessor'))
      this.methodName = methodName
      this.mutator = mutator
      this.args = args
    }
  }

  /**
   * Put entry processor.
   *
   * An implementation of an EntryProcessor that does nothing and returns
   * `true` as a result of execution.
   */
  export class NullProcessor
    extends EntryProcessor {
    /**
     * Singleton `NullProcessor` instance.
     */
    static readonly INSTANCE: NullProcessor = new NullProcessor()

    /**
     * Construct a Null EntryProcessor.
     */
    protected constructor () {
      super('util.NullEntryProcessor')
    }
  }

  /**
   * The NumberIncrementor entry processor is used to increment a property value
   * of a numeric type.
   *
   * @typeParam K  the type of the Map entry key
   * @typeParam V  the type of the Map entry value
   */
  export class NumberIncrementor<K = any, V = any>
    extends PropertyProcessor<K, V, number> {
    /**
     * The number to increment by.
     */
    protected increment: number

    /**
     * Whether to return the value before it was multiplied ("post-factor") or
     * after it is multiplied ("pre-factor").
     */
    protected postIncrement: boolean

    /**
     * Construct an NumberIncrementor processor that will increment a property
     * value by a specified amount, returning either the old or the new value
     * as specified.
     *
     * @param nameOrManipulator  the ValueManipulator or property name
     * @param increment          the Number representing the magnitude and sign of
     *                           the increment
     * @param postIncrement      pass `true` to return the value as it was before
     *                           it was incremented, or `pass` false to return the
     *                           value as it is after it is incremented
     */
    constructor (nameOrManipulator: extractor.ValueManipulator | string, increment: number, postIncrement: boolean = false) {
      super(processorName('NumberIncrementor'),
        typeof nameOrManipulator === 'string'
          ? NumberIncrementor.createCustomManipulator<V>(nameOrManipulator)
          : nameOrManipulator)

      this.increment = increment
      this.postIncrement = postIncrement
    }

    /**
     * Create the updater that will perform the manipulation of the value.
     *
     * @param name  the property name
     * @hidden
     */
    private static createCustomManipulator<V> (name: string): extractor.ValueManipulator {
      return new extractor.CompositeUpdater(new extractor.UniversalExtractor(name), new extractor.UniversalUpdater(name))
    }

    /**
     * Configure the processor to return the value of the property *before* being incremented.
     */
    returnOldValue (): this {
      this.postIncrement = true
      return this
    }

    /**
     * Configure the processor to return the value of the property *after* being incremented.
     */
    returnNewValue (): this {
      this.postIncrement = false
      return this
    }
  }

  /**
   * NumberMultiplier entry processor.
   *
   * @param <K> the type of the Map entry key
   * @param <V> the type of the Map entry value
   */
  export class NumberMultiplier<K = any, V = any>
    extends PropertyProcessor<K, V, number> {
    /**
     The number to multiply by.
     */
    protected multiplier: number

    /**
     * Whether to return the value before it was multiplied (`post-factor`) or
     * after it is multiplied (`pre-factor`).
     */
    protected postMultiplication: boolean

    /**
     * Construct an NumberMultiplier processor that will multiply a property
     * value by a specified factor, returning either the old or the new value
     * as specified.
     *
     * @param nameOrManipulator   the ValueManipulator or the property name
     * @param multiplier          the Number representing the magnitude and sign of
     *                            the multiplier
     * @param postMultiplication  pass true to return the value as it was before
     *                            it was multiplied, or pass false to return the
     *                            value as it is after it is multiplied
     */
    constructor (nameOrManipulator: extractor.ValueManipulator | string, multiplier: number, postMultiplication: boolean = false) {
      super(processorName('NumberMultiplier'),
        typeof nameOrManipulator === 'string'
          ? NumberMultiplier.createCustomManipulator<V>(nameOrManipulator)
          : nameOrManipulator)

      this.multiplier = multiplier
      this.postMultiplication = postMultiplication
    }

    // uses UniversalExtractor and UniversalUpdater respectively.
    private static createCustomManipulator<V> (name: string): extractor.ValueManipulator {
      return new extractor.CompositeUpdater(new extractor.UniversalExtractor(name), new extractor.UniversalUpdater(name))
    }

    /**
     * Configure the processor to return the value of the property *before* being multiplied.
     */
    returnOldValue (): this {
      this.postMultiplication = true
      return this
    }

    /**
     * Configure the processor to return the value of the property *after* being incremented.
     */
    returnNewValue (): this {
      this.postMultiplication = false
      return this
    }
  }

  /**
   * PreloadRequest is a simple EntryProcessor that performs a get call.
   * No results are reported back to the caller.
   * <p>
   * The PreloadRequest process provides a means to "pre-load" an entry or a
   * collection of entries into the cache using the cache loader without
   * incurring the cost of sending the value(s) over the network. If the
   * corresponding entry (or entries) already exists in the cache, or if the
   * cache does not have a loader, then invoking this EntryProcessor has no
   * effect.
   */
  export class PreloadRequest<K = any, V = any>
    extends EntryProcessor<K, V, void> {
    /**
     * Construct a PreloadRequest EntryProcessor.
     */
    constructor () {
      super(processorName('PreloadRequest'))
    }
  }

  /**
   * ScriptProcessor wraps a script written in one of the languages supported by Graal VM.
   *
   * @typeParam K  the type of the Map entry key
   * @typeParam V  the type of the Map entry value
   * @typeParma R  the type of value returned by the processor
   */
  export class ScriptProcessor<K = any, V = any, R = any>
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
      super(processorName('ScriptProcessor'))
      this.language = language
      this.name = name
      this.args = args ? args : new Array<any>()
    }
  }

  /**
   * Touches an entry (if present) in order to trigger interceptor re-evaluation
   * and possibly increment expiry time.
   */
  export class TouchProcessor<K = any, V = any>
    extends EntryProcessor<K, V, void> {
    /**
     * Construct a `Touch` {@link EntryProcessor}.
     */
    constructor () {
      super(processorName('TouchProcessor'))
    }
  }

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
    protected readonly updater: extractor.ValueUpdater | null

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
    constructor (updaterOrPropertyName: string | extractor.ValueUpdater | null, value: T) {
      super(processorName('UpdaterProcessor'))
      if (typeof updaterOrPropertyName === 'string') {
        const methodName = updaterOrPropertyName
        this.updater = (methodName.indexOf('.') < 0)
          ? new extractor.UniversalUpdater(methodName)
          : new extractor.CompositeUpdater(methodName)
      } else {
        this.updater = updaterOrPropertyName
      }
      this.value = value
    }
  }

  /**
   * `VersionedPut` is an {@link EntryProcessor} that assumes that entry values
   * are versioned (see Coherence Versionable interface for details) and performs an
   * update/insert operation if and only if the version of the specified value matches
   * the version of the corresponding value. `VersionedPutAll` will increment the version
   * indicator before each value is updated.
   */
  export class VersionedPut<K = any, V = any>
    extends EntryProcessor<K, V, V> {
    /**
     * Specifies the new value to update an entry with.
     */
    protected readonly value: V

    /**
     * Specifies whether or not an insert is allowed.
     */
    protected readonly insert?: boolean

    /**
     * Specifies whether or not a return value is required.
     */
    protected 'return'?: boolean

    /**
     * Construct a `VersionedPut` that updates an entry with a new value if and
     * only if the version of the new value matches to the version of the
     * current entry's value. This processor optionally returns the current
     * value as a result of the invocation if it has not been updated (the
     * versions did not match).
     *
     * @param value          a value to update an entry with
     * @param allowInsert    specifies whether or not an insert should be
     *                       allowed (no currently existing value)
     * @param returnCurrent  specifies whether or not the processor should
     *                       return the current value in case it has not been
     *                       updated
     */
    constructor (value: V, allowInsert: boolean = false, returnCurrent: boolean = false) {
      super(processorName('VersionedPut'))

      this.value = value
      this.insert = allowInsert
      this.return = returnCurrent
    }

    returnCurrent (returnCurrent: boolean = true): this {
      this.return = returnCurrent
      return this
    }
  }

  /**
   * `VersionedPutAll` is an {@link EntryProcessor} that assumes that entry values
   * are versioned (see Coherence Versionable interface for details) and performs an
   * update/insert operation only for entries whose versions match to versions
   * of the corresponding current values. In case of the match, the
   * `VersionedPutAll` will increment the version indicator before each value is
   * updated.
   *
   * @typeParam K  the type of the Map entry key
   * @typeParam V  the type of the Map entry value
   */
  export class VersionedPutAll<K = any, V = any>
    extends EntryProcessor<K, V, void> {
    /**
     * Specifies the new value to update an entry with.
     */
    protected readonly entries: MapHolder<K, V>

    /**
     * Specifies whether or not an insert is allowed.
     */
    protected readonly insert?: boolean

    /**
     * Specifies whether or not a return value is required.
     */
    protected readonly 'return'?: boolean

    /**
     * Construct a VersionedPutAll processor that updates an entry with a new
     * value if and only if the version of the new value matches to the
     * version of the current entry's value (which must exist). This processor
     * optionally returns a map of entries that have not been updated (the
     * versions did not match).
     *
     * @param map            a map of values to update entries with
     * @param allowInsert    specifies whether or not an insert should be
     *                       allowed (no currently existing value)
     * @param returnCurrent  specifies whether or not the processor should
     *                       return the entries that have not been updated
     */
    constructor (map: Map<K, V>, allowInsert: boolean = false, returnCurrent: boolean = false) {
      super(processorName('VersionedPutAll'))
      this.entries = new MapHolder(map)
      this.insert = allowInsert
      this.return = returnCurrent
    }
  }


  function processorName (name: string): string {
    return 'processor.' + name
  }

  class MapHolder<K, V> {
    entries: Array<{ key: any, value: any }>

    constructor (entries: Map<K, V>) {
      this.entries = new Array<{ key: K, value: V }>()
      for (const [k, v] of entries) {
        this.entries.push({key: k, value: v})
      }
    }
  }

}

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
  static conditionalPut<K = any, V = any> (filter: filter.Filter, value: V, returnValue?: boolean): processor.ConditionalPut<K, V> {
    return new processor.ConditionalPut(filter, value, returnValue)
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
  static conditionalPutAll<K = any, V = any> (filter: filter.Filter, map: Map<K, V>): processor.ConditionalPutAll<K, V> {
    return new processor.ConditionalPutAll(filter, map)
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
  static conditionalRemove<K = any, V = any> (filter: filter.Filter, returnValue?: boolean): processor.ConditionalRemove<K, V> {
    return new processor.ConditionalRemove(filter, returnValue)
  }

  /**
   * Construct an extract processor based on the specified {@link extractor.ValueExtractor}.
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
  static extract<K = any, V = any, R = any> (extractorOrFieldName?: string): processor.EntryProcessor<K, V, R> {
    return new processor.ExtractorProcessor(extractorOrFieldName)
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
  static increment<K = any, V = any> (propertyOrManipulator: extractor.ValueManipulator | string, value: number, returnOldValue: boolean = false): processor.NumberIncrementor<K, V> {
    return new processor.NumberIncrementor(propertyOrManipulator, value, returnOldValue)
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
  static invokeAccessor<K = any, V = any, R = any> (methodName: string, ...args: any[]): processor.EntryProcessor<K, V, R> {
    return new processor.MethodInvocationProcessor(methodName, false, args)
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
  static invokeMutator<K = any, V = any, R = any> (methodName: string, ...args: any[]): processor.EntryProcessor<K, V, R> {
    return new processor.MethodInvocationProcessor(methodName, true, args)
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
  static multiply<K = any, V = any> (propertyOrManipulator: string, numFactor: number, returnOldValue: boolean = false): processor.NumberMultiplier<K, V> {
    return new processor.NumberMultiplier(propertyOrManipulator, numFactor, returnOldValue)
  }

  /**
   * Return an {@link EntryProcessor} that does nothing and returns `true` as a result of execution.
   *
   * @typeParam K  the type of the Map entry keys
   * @typeParam V  the type of the Map entry values
   *
   * @return an {@link EntryProcessor} that does nothing and returns `true` as a result of execution
   */
  static nop<K = any, V = any> (): processor.EntryProcessor<K, V> {
    return processor.NullProcessor.INSTANCE
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
  static update<K = any, V = any, T = any> (propertyOrUpdater: string | extractor.ValueUpdater, value: T): processor.UpdaterProcessor<K, V, T> {
    return new processor.UpdaterProcessor<K, V, T>(propertyOrUpdater, value)
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
  static versionedPut<K = any, V = any> (value: V, allowInsert: boolean = false, returnCurrent: boolean = false): processor.VersionedPut<K, V> {
    return new processor.VersionedPut(value, allowInsert, returnCurrent)
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
  static versionedPutAll<K = any, V = any> (map: Map<K, V>, allowInsert: boolean = false, returnCurrent: boolean = false): processor.VersionedPutAll<K, V> {
    return new processor.VersionedPutAll(map, allowInsert, returnCurrent)
  }

  /**
   * Construct the preload request processor.
   *
   * @typeParam K  the type of the Map entry key
   * @typeParam V  the type of the Map entry value
   *
   * @return a preload request processor
   */
  static preload<K = any, V = any> (): processor.PreloadRequest<K, V> {
    return new processor.PreloadRequest()
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
  static script<K = any, V = any, R = any> (language: string, name: string, ...args: any[]): processor.ScriptProcessor<K, V, R> {
    return new processor.ScriptProcessor(language, name, args)
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
  static touch (): processor.TouchProcessor {
    return new processor.TouchProcessor()
  }
}
