import { BaseProcessor } from './base_processor';

/**
 * PreloadRequest entry processor.
 */
export class PreloadRequestProcessor<K, V>
    extends BaseProcessor<K, V, void> {

    /**
     * Construct a PreloadRequest EntryProcessor.
     */
    constructor() {
        super('PreloadRequest');
    }

}
