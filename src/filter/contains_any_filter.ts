import { ComparisonFilter } from './filter';
import { ValueExtractor } from '../extractor/value_extractor';

export class ContainsAnyFilter<T, E>
    extends ComparisonFilter<T, E, Set<any>> {

    constructor(extractor: ValueExtractor<T, E>, setValues: Set<any>) {
        super('ContainsAnyFilter', extractor, setValues);
    }
}