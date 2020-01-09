import { BaseProcessor } from './base_processor';

/**
 * Script is an entry processor that performs a remove
 * operation if the specified condition is satisfied.
 *
 */
export class ScriptProcessor<K, V>
    extends BaseProcessor<K, V, V> {

    /**
     * The script name.
     */
    script: string;

    /**
     * The args for the script.
     */
    args: any[];

    /**
     * Construct a Script EntryProcessor.
     *
     * @param args  The args for the script.
     */
    constructor(script: string, ...args: any[]) {
        super('Script');
        this.script = script;
        this.args = args;
    }

}
