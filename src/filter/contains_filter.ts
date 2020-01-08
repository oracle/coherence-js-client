import { ComparisonFilter } from './filter';
import { ValueExtractor } from '../extractor/value_extractor';

export class ContainsFilter<T, E>
    extends ComparisonFilter<T, E, E> {

    values: any;

    constructor(extractor: ValueExtractor<T, E | E[]>, value: E) {
        super('ContainsFilter', extractor, value);
    }
}