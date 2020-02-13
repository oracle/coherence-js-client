import { Filter, ExtractorFilter, ComparisonFilter } from './filter';
import { ValueExtractor } from '../extractor/value_extractor';

/**
 * Filter which returns true for {@link com.tangosol.util.InvocableMap.Entry}
 * objects that currently exist in a Map.
 * <p>
 * This Filter is intended to be used solely in combination with a
 * {@link com.tangosol.util.processor.ConditionalProcessor} and is unnecessary
 * for standard {@link com.tangosol.util.QueryMap} operations.
 *
 * @param <T> the type of the input argument to the filter
 *
 * @see com.tangosol.util.InvocableMap.Entry#isPresent()
 */
export class RegexFilter<T = any, E = any>
    extends ComparisonFilter<T, E, string> {

    constructor(extractor: ValueExtractor<T, E>, regex: string);
    constructor(method: string, regex: string);
    constructor(methodOrExtractor: string | ValueExtractor<T, E>, regex: string) {
        if (methodOrExtractor instanceof ValueExtractor) {
            super('RegexFilter', methodOrExtractor, regex);
        } else {
            super('RegexFilter', methodOrExtractor, regex);
        }
    }

}