import { ComparisonFilter } from './filter';
import { ValueExtractor } from '../extractor/value_extractor';

export class GreaterFilter<T=any, E=any>
    extends ComparisonFilter<T, E, E> {

    constructor(extractor: ValueExtractor<T, E>, value: E) {
        super('GreaterFilter', extractor, value);
    }
}