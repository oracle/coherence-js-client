/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { Filter } from "../filter/filter";
import { EntryProcessor } from '../processor/entry_processor';
import { RemoteCache } from "./remote_cache";

export interface InvocableMap<K = any, V = any>
    extends RemoteCache<K, V> {

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
     * @param keys      the keys to process; these keys are not required to
     *                  exist within the Map
     * @param filter    the Filter that is used to select the keys to be
     *                  processed
     * @param processor the EntryProcessor to use to process the specified keys
     *
     * @return a Map containing the results of invoking the EntryProcessor
     *         against each of the specified keys
     */
    invokeAll<R>(processor: EntryProcessor<K, V, R>): Promise<Map<K, R>>;
    invokeAll<R>(keys: Iterable<K>, processor: EntryProcessor<K, V, R>): Promise<Map<K, R>>;
    invokeAll<R>(filter: Filter<V>, processor: EntryProcessor<K, V, R>): Promise<Map<K, R>>;
}