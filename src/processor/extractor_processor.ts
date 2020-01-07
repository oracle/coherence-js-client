import { BaseProcessor } from './base_processor';
import { Util } from '../util/util';
import { IdentityExtractor, ValueExtractor, ReflectionExtractor, ChainedExtractor } from '../extractor/value_extractor';

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
export class ExtractorProcessor<K, V, T, E>
    extends BaseProcessor<K, V, T> {

    extractor: ValueExtractor<T, E>;

    constructor(methodName?: string) {
        super('ExtractorProcessor');
        if (!methodName) {
            this.extractor = IdentityExtractor.INSTANCE;
        } else {
            this.extractor = (methodName.indexOf('.') < 0)
                ? new ReflectionExtractor(methodName)
                : new ChainedExtractor(methodName);
        }
    }

}
