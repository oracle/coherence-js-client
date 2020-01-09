import { BaseProcessor } from './base_processor';
import { Filter } from '../filter/filter';

export class ConditionalPutProcessor<K, V>
    extends BaseProcessor<K, V, V> {

    /**
     * The underlying filter.
     */
    filter: Filter<V>;

    /**
     * Specifies the new value to update an entry with.
     */
    value: V;

    /**
     * Specifies whether or not a return value is required.
     */
    'return': boolean = true;

    /**
     * Construct a ConditionalPut that updates an entry with a new value if
     * and only if the filter applied to the entry evaluates to true.
     * The result of the {@link process()} invocation does not return any
     * result.
     *
     * @param filter  the filter to evaluate an entry
     * @param value   a value to update an entry with
     */
    constructor(filter: Filter<V>, value: V, returnValue?: boolean) {
        super('ConditionalPut');

        this.filter = filter;
        this.value = value;
        this['return'] = returnValue ? returnValue : true;
    }

    returnCurrent(returnCurrent?: boolean): this {
        this['return'] = returnCurrent? returnCurrent : true;
        return this;
    }
    
    doesReturnValue(): boolean {
        return this['return'];
    }

    getValue(): V {
        return this.value;
    }

}
