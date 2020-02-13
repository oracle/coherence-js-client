import { ComparisonFilter } from './filter';
import { ValueExtractor } from '../extractor/value_extractor';

export class EqualsFilter<T = any, E = any>
    extends ComparisonFilter<T, E, E> {

    constructor(typeName: string = 'EqualsFilter', extractor: ValueExtractor<T, E>, value: E) {
        super(typeName, extractor, value);
    }

}