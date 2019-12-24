import { ComparisonFilter } from './base_filter';
import { ValueExtractor } from '../extractor/value_extractor';

export class GreaterEqualsFilter<T, E>
    extends ComparisonFilter<TypeError, E, E> {

    constructor(extractor: ValueExtractor<T, E>, value: E) {
        super('GreaterEqualsFilter', extractor, value);
    }
}