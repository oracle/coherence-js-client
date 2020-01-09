import { BaseProcessor } from './base_processor';
import { Filter } from '../filter/filter';

/**
 * RemoveBlind entry processor.
 *
 * @param <K> the type of the Map entry key
 * @param <V> the type of the Map entry value
 */
export class RemoveBlindProcessor<K, V>
    extends BaseProcessor<K, V, void> {

    /**
     * Construct a RemoveBlind EntryProcessor.
     */
    constructor() {
        super('RemoveBlind');
    }

}
