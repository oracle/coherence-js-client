import { BaseProcessor } from './base_processor';
import { Filter } from '../filter/filter';

/**
 * Put entry processor.
 *
 * @param <K> the type of the Map entry key
 * @param <V> the type of the Map entry value
 */
export class PutIfAbsentProcessor<K, V>
    extends BaseProcessor<K, V, void> {

    /**
     * Specifies the new value to update an entry with.
     */
    value: V;

    /**
     * Construct a PutIfAbsent EntryProcessor.
     *
     * @param value   a value to update an entry with
     */
    constructor(value: V) {
        super('PutIfAbsent');

        this.value = value;
    }

    getValue(): V {
        return this.value;
    }

}
