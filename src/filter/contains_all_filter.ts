import { ComparisonFilter } from './filter';
import { ValueExtractor } from '../extractor/value_extractor';

export class ContainsAllFilter<T=any, E=any>
    extends ComparisonFilter<T, E, any> {

    constructor(extractor: ValueExtractor<T, E>, setValues: any) {
        super('ContainsAllFilter', extractor, setValues);
    }
}