import { BaseProcessor } from './base_processor';
import { Filter } from '../filter/filter';

/**
 * Remove entry processor.
 *
 * @param <K> the type of the Map entry key
 * @param <V> the type of the Map entry value
 */
export class RemoveProcessor<K, V>
    extends BaseProcessor<K, V, void> {

    /**
     * Construct a Remove EntryProcessor.
     *
     * @param filter  the filter to evaluate an entry
     * @param value   a value to update an entry with
     */
    constructor() {
        super('Remove');
    }

}
