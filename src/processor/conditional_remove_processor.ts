import { BaseProcessor } from './base_processor';
import { Filter } from '../filter/filter';

/**
 * ConditionalRemove is an entry processor that performs a remove
 * operation if the specified condition is satisfied.
 *
 */
export class ConditionalRemoveProcessor<K, V>
    extends BaseProcessor<K, V, V> {

    /**
     * The underlying filter.
     */
    filter: Filter<V>;

    /**
     * Specifies whether or not a return value is required.
     */
    'return'?: boolean;

    /**
     * Construct a ConditionalPut that updates an entry with a new value if
     * and only if the filter applied to the entry evaluates to true.
     * The result of the {@link process()} invocation does not return any
     * result.
     *
     * @param filter  the filter to evaluate an entry
     */
    constructor(filter: Filter<V>, returnValue?: boolean) {
        super('ConditionalRemove');

        this.filter = filter;
        this['return'] = returnValue;
    }

    returnCurrent(returnCurrent: boolean = true): this {
        this['return'] = returnCurrent ;
        console.log("** Setting returnCurrent: " + this['return']);
        return this;
    }

}
