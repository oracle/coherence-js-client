import { ComparisonFilter } from './filter';
import { ValueExtractor } from '../extractor/value_extractor';

export class NotEqualsFilter<T, E>
    extends ComparisonFilter<T, E, E> {
        
    constructor(typeName: string = 'NotEqualsFilter', extractor: ValueExtractor<T, E>, value: E) {
        super(typeName, extractor, value);
    }
}