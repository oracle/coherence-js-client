import { ComparisonFilter } from './base_filter';
import { ValueExtractor } from '../extractor/value_extractor';

export class EqualsFilter<T, E>
    extends ComparisonFilter<T, E, E> {

    constructor(extractor: ValueExtractor<T, E>, value: E) {
        super('EqualsFilter', extractor, value);
    }

    /*
      this['@class'] = toFilterClassName('EqualsFilter');
  this.extractor = new UniversalExtractor(property);
  this.value     = value;*/

}