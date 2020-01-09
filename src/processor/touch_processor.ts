import { BaseProcessor } from './base_processor';

/**
 * Touch entry processor.
 */
export class TouchProcessor<K, V>
    extends BaseProcessor<K, V, void> {

    /**
     * Construct a Touch EntryProcessor.
     */
    constructor() {
        super('Touch');
    }

}
