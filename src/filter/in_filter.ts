import { ComparisonFilter } from './filter';
import { ValueExtractor } from '../extractor/value_extractor';

export class InFilter<T, E>
    extends ComparisonFilter<T, E, E[]> {

    constructor(extractor: ValueExtractor<T, E>, setValues: Set<E>) {
        super('InFilter', extractor, Array.from(setValues));
    }
}