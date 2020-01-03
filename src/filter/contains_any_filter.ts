import { ComparisonFilter } from './filter';
import { ValueExtractor } from '../extractor/value_extractor';

export class ContainsAnyFilter<T, E>
    extends ComparisonFilter<T, E, any> {

    constructor(extractor: ValueExtractor<T, E>, setValues: any) {
        super('ContainsAnyFilter', extractor, setValues);
    }
}