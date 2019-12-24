import { Filter } from './filter';
import { BaseFilter } from './base_filter';

export class NeverFilter
    extends BaseFilter<any> {

    constructor() {
        super('NeverFilter');
    }

}