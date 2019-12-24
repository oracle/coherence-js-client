import { ComparisonFilter } from './base_filter';
import { ValueExtractor } from '../extractor/value_extractor';

export class LessEqualsFilter<T, E>
    extends ComparisonFilter<TypeError, E, E> {

    constructor(extractor: ValueExtractor<T, E>, value: E) {
        super('LessEqualsFilter', extractor, value);
    }
}