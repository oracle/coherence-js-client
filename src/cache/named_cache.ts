/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ConcurrentMap } from "./concurrent_map";
import { QueryMap } from "./query_map";
import { RemoteCache } from "./remote_cache";
import { InvocableMap } from './invocable_map';
import { CacheMap } from "./cache_map";
import { ObservableMap } from "../util/observable_map";

export interface NamedCache<K, V>
    extends CacheMap<K, V>,
            ConcurrentMap<K, V>,
            InvocableMap<K, V>,
            ObservableMap<K, V>,
            RemoteCache<K, V>,
            QueryMap<K, V> {

    /**
     * Release and destroy this instance of NamedCache.
     * Warning: This method is used to completely destroy the specified cache 
     * across the cluster. All references in the entire cluster to this cache 
     * will be invalidated, the cached data will be cleared, and all resources 
     * will be released.
     */
    destroy(): Promise<void>;

    /**
     * Return the cache name.
     * 
     * @returns The cache name.
     */
    getCacheName(): string;

    /**
     * Returns if the cache is active or not.
     */
    isActive(): boolean;

    /**
     * Release local resources associated with this instance of NamedCache.
     * Releasing a cache makes it no longer usable, but does not affect the cache 
     * itself. In other words, all other references to the cache will still be valid, 
     * and the cache data is not affected by releasing the reference. Any attempt 
     * to use this reference afterword will result in an exception.
     */
    release(): Promise<void>;

}