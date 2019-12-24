import { ValueExtractor } from '../extractor/value_extractor';
import { ComparisonFilter } from './base_filter';

export class IsNullFilter<T, E>
    extends ComparisonFilter<T, E, E | null> {

    constructor(extractor: ValueExtractor<T, E>) {
        super('IsNullFilter', extractor);
    }
}