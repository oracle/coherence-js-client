import { ValueExtractor } from '../extractor/value_extractor';
import { ComparisonFilter } from './base_filter';

export class IsNotNullFilter<T, E>
    extends ComparisonFilter<T, E, E | null> {

    constructor(extractor: ValueExtractor<T, E>) {
        super('IsNotNullFilter', extractor);
    }
}