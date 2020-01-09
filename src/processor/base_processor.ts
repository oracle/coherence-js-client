import { EntryProcessor } from './entry_processor';
import { Util } from '../util/util';
import { MapEntry } from '../cache/query_map';
import { Filter } from '../filter/filter';

/**
 * An invocable agent that operates against the entry objects within a
 * {@link module:coherence-js/cache/NamedCache}.  Several of the methods
 * on `NamedCache` that accept a processor can also accept filter to
 * constrain the set of entries to which the processor will be applied.
 * 
 * @param <K> the type of the NamedCache entry key.
 * @param <V> the type of the NamedCache entry value.
 * @param <R> the type of value returned by the EntryProcessor.
 * 
 */
export abstract class BaseProcessor<K, V, R>
    implements EntryProcessor<K, V, R> {

    '@class': string;

    constructor(typeName: string) {
        this['@class'] = Util.PROCESSOR_PACKAGE + typeName;
    }

    process(entry: MapEntry<K, V>): R {
        throw new Error('process() not implemented in BaseProcessor');
    }
    
    andThen(processor: EntryProcessor<K, V, any>): CompositeProcessor<K, V> {
        return new CompositeProcessor(this, processor);
    }

    when(filter: Filter<V>): EntryProcessor<K, V, R> {
        return new ConditionalProcessor(filter, this);
    }
}


export class MapHolder<K, V> {
    entries: Array<{key: any, value: any}>;

    constructor(entries: Map<K, V>) {
        this.entries = new Array<{key: any, value: any}>();
        for (let [k, v] of entries) {
            this.entries.push({key: k, value: v})
        }
    }
}

/**
 * ConditionalProcessor` represents a processor that is invoked
 * conditionally based on the result of an entry evaluation.  A
 * `ConditionalProcessor` is returned from the `when()` function, which
 * takes a filter as its argument.
 *
 * @param {@link Filter} the argument to `when()`
 *
 * @example
 * var processor = Processor.extract('name').when(Filter.greater('age', 40));
 * map.invokeAll(Filter.equal('gender', 'Male'), processor)
 *      .then(function (data) {
 *        console.log("Male over 40: " + data.name);
 *      });
 */
export class ConditionalProcessor<K, V, T>
    extends BaseProcessor<K, V, T> {

    filter: Filter<V>;

    processor: EntryProcessor<K, V, T>;

    /**
     * Construct a ConditionalProcessor for the specified filter and the
     * processor.
     * <p>
     * The specified entry processor gets invoked if and only if the filter
     * applied to the InvocableMap entry evaluates to true; otherwise the
     * result of the {@link #process} invocation will return <tt>null</tt>.
     *
     * @param filter     the filter
     * @param processor  the entry processor
     */
    constructor(filter: Filter<V>, processor: EntryProcessor<K, V, T>) {
        super('ConditionalProcessor');

        this.filter = filter;
        this.processor = processor;
    }

}

/**
 * CompositeProcessor represents a collection of entry processors that are
 * invoked sequentially against the same MapEntry.
 * 
 * @param <K> the type of the MapEntry key
 * @param <V> the type of the MapEntry value
 * @param <R> the type of the EntryProcessor return value
 */
export class CompositeProcessor<K, V>
    extends BaseProcessor<K, V, any> {

        public static EMPTY_PROCESSOR_ARRAY = new Array<EntryProcessor>();

        processors: Array<EntryProcessor<K, V, any>>;

        constructor(...processors: EntryProcessor<K, V, any>[]) {
            super('CompositeProcessor');
            this.processors = processors;
        }

        andThen(processor: EntryProcessor<K, V, any>): this {
            this.processors.push(processor);
            return this;
        }
}