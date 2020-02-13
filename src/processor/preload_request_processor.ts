import { BaseProcessor } from './base_processor';

/**
 * PreloadRequest entry processor.
 */
export class PreloadRequestProcessor<K=any, V=any>
    extends BaseProcessor<K, V, void> {

    /**
     * Construct a PreloadRequest EntryProcessor.
     */
    constructor() {
        super('PreloadRequest');
    }

}
