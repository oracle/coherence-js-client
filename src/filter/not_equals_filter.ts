import { ComparisonFilter } from './base_filter';
import { ValueExtractor } from '../extractor/value_extractor';

export class NotEqualsFilter<T, E>
    extends ComparisonFilter<T, E, E> {

    constructor(extractor: ValueExtractor<T, E>, value: E) {
        super('NotEqualsFilter', extractor, value);
    }
}