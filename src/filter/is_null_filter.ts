import { ValueExtractor } from '../extractor/value_extractor';
import { ComparisonFilter } from './filter';
import { EqualsFilter } from './equals_filter';

export class IsNullFilter<T, E>
    extends EqualsFilter<T, E | null> {

    constructor(extractor: ValueExtractor<T, E>) {
        super('IsNullFilter', extractor, null);
    }
}