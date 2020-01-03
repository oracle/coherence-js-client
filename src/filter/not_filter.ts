import { Filter } from './filter';

export class NotFilter<T>
    extends Filter<T> {

    filter: Filter<T>;

    constructor(filter: Filter<T>) {
        super('NotFilter');
        this.filter = filter;
    }

}