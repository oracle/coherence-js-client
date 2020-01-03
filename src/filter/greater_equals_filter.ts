import { ComparisonFilter } from './filter';
import { ValueExtractor } from '../extractor/value_extractor';

export class GreaterEqualsFilter<T, E>
    extends ComparisonFilter<T, E, E> {

    constructor(extractor: ValueExtractor<T, E>, value: E) {
        super('GreaterEqualsFilter', extractor, value);
    }
}