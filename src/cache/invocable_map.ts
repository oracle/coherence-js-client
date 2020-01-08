import { Filter } from "../filter/filter";
import { EntryProcessor } from '../processor/entry_processor';

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
    invoke<R>(key: K, processor: EntryProcessor<K, V, R>): Promise<R | null>;

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
    invokeAll<R=any>(processor: EntryProcessor<K, V, R>): Promise<Map<K, R>>;
    invokeAll<R=any>(keys: Iterable<K>, processor: EntryProcessor<K, V, R>): Promise<Map<K, R>>;
    invokeAll<R=any>(filter: Filter<V>, processor: EntryProcessor<K, V, R>): Promise<Map<K, R>>;
    invokeAll<R=any>(keysOrFilterOrProcessor: Iterable<K> | Filter<V> | EntryProcessor<K, V, R>, processor?: EntryProcessor<K, V, R>): Promise<Map<K, R>>;
}