import { Filter } from './filter';

/**
* Filter which always evaluates to `true`.
*
* @param <T> the type of the input argument to the filter.
*/
export class AlwaysFilter<T = any>
    extends Filter<T> {

    /**
     * Construct an AlwaysFilter.
     */
    constructor() {
        super('AlwaysFilter');
    }

}