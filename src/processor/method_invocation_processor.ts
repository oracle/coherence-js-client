import { BaseProcessor } from './base_processor';

/**
 * An entry processor that invokes the specified method on a value 
 * of a cache entry and optionally updates the entry with a 
 * modified value.
 */
export class MethodInvocationProcessor<K=any, V=any, R=any>
    extends BaseProcessor<K, V, R> {

    /**
     * The Method name.
     */
    methodName: string;

    /**
     * The args for the MethodInvocation.
     */
    args: Array<any>;

    /**
     * A flag specifying whether the method mutates the state of a target object.
     */
    mutator: boolean;

    /**
     * Construct a MethodInvocation EntryProcessor.
     *
     * @param args  The args for the MethodInvocation.
     */
    constructor(methodName: string, mutator: boolean, args: any[]) {
        super('MethodInvocationProcessor');
        this.methodName = methodName;
        this.mutator = mutator;
        this.args = args;
    }

}
