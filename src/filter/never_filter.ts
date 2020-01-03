import { Filter } from './filter';

export class NeverFilter
    extends Filter<any> {

    constructor() {
        super('NeverFilter');
    }

}