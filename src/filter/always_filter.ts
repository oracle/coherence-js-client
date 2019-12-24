import { BaseFilter } from './base_filter';
import { Util } from '../util/util';

export class AlwaysFilter
    extends BaseFilter<any> {

    constructor() {
        super('AlwaysFilter');
    }

}