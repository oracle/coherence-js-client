import { EntryProcessor } from './entry_processor';
import { Util } from '../util/util';

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

}
