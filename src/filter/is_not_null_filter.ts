import { ValueExtractor } from '../extractor/value_extractor';
import { NotEqualsFilter } from './not_equals_filter';

export class IsNotNullFilter<T=any, E=any>
    extends NotEqualsFilter<T, E | null> {

    constructor(extractor: ValueExtractor<T, E>) {
        super('IsNotNullFilter', extractor, null);
    }
}