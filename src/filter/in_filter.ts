import { ComparisonFilter } from './base_filter';
import { ValueExtractor } from '../extractor/value_extractor';

export class InFilter<T, E>
    extends ComparisonFilter<T, E, any[]> {

    constructor(extractor: ValueExtractor<T, E>, setValues: any[]) {
        super('InFilter', extractor, setValues);
    }
}