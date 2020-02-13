import { ComparisonFilter } from './filter';
import { ValueExtractor } from '../extractor/value_extractor';

export class LessFilter<T=any, E=any>
    extends ComparisonFilter<T, E, E> {

    constructor(extractor: ValueExtractor<T, E>, value: E) {
        super('LessFilter', extractor, value);
    }
}