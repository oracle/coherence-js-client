import { Filter } from './filter';

export class NotFilter<T=any>
    extends Filter<T> {

    filter: Filter<T>;

    constructor(filter: Filter<T>) {
        super('NotFilter');
        this.filter = filter;
    }

}