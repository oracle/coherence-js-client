import { Filter } from "../filter/filter";

export interface Entry<K, V> {

}

export abstract class EntryProcessor<K, V, R> {

    '@class': string;

    constructor(typeName: string) {
        this['@class'] = typeName;
    }
    
}

export interface InvocableMap<K, V> {

    /**
     * Invoke the passed EntryProcessor against the Entry specified by the
     * passed key, returning the result of the invocation.
     *
     * @param <R>       the type of value returned by the EntryProcessor
     * @param key       the key to process; it is not required to exist within
     *                  the Map
     * @param processor the EntryProcessor to use to process the specified key
     *
     * @return the result of the invocation as returned from the EntryProcessor
     */
    invoke<R>(key: K, processor: EntryProcessor<K, V, R>): R;

    /**
     * Invoke the passed EntryProcessor against the entries specified by the
     * passed keys, returning the result of the invocation for each.
     *
     * @param <R>       the type of value returned by the EntryProcessor
     * @param collKeys  the keys to process; these keys are not required to
     *                  exist within the Map
     * @param processor the EntryProcessor to use to process the specified keys
     *
     * @return a Map containing the results of invoking the EntryProcessor
     * against each of the specified keys
     */
    invokeAll<R>(keysOrFilter: Set<K> | Filter<V> | undefined, processor: EntryProcessor<K, V, R>): Map<K, R>;
}