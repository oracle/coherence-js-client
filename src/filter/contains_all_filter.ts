import { ComparisonFilter } from './filter';
import { ValueExtractor } from '../extractor/value_extractor';

export class ContainsAllFilter<T, E>
    extends ComparisonFilter<T, E, any> {

    constructor(extractor: ValueExtractor<T, E>, setValues: any) {
        super('ContainsAllFilter', extractor, setValues);
    }
}