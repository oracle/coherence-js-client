import { BaseProcessor } from './base_processor';
import { Filter } from '../filter/filter';
import { MapEntry } from '../cache/query_map';

export class ConditionalPutAllProcessor<K, V>
    extends BaseProcessor<K, V, V> {

    /**
     * The underlying filter.
     */
    filter: Filter<V>;

    /**
     * Specifies the new value to update an entry with.
     */
    entries: MapHolder<K, V>;
 
    /**
     * Construct a ConditionalPutAll processor that updates an entry with a
     * new value if and only if the filter applied to the entry evaluates to
     * true. The new value is extracted from the specified map based on the
     * entry's key.
     *
     * @param filter  the filter to evaluate all supplied entries
     * @param map     a map of values to update entries with
     */
    constructor(filter: Filter<V>, entries: Map<K, V>) {
        super('ConditionalPutAll');

        this.filter = filter;
        this.entries = new MapHolder(entries);
    }

}

class MapHolder<K, V> {
    entries: Array<{key: any, value: any}>;

    constructor(entries: Map<K, V>) {
        this.entries = new Array<{key: any, value: any}>();
        for (let [k, v] of entries) {
            this.entries.push({key: k, value: v})
        }
    }
}
