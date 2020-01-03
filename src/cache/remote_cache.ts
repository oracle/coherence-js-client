import { ConcurrentMap } from "./concurrent_map";
import { QueryMap } from "./query_map";
import { NamedCacheEntry, RemoteSet } from './streamed_collection';



export interface RemoteCache<K, V> {

    /**
     * Clears all the mappings in the cache.
     *
     * @return A Promise that eventually resolves (with an undefined value).
     */
    clear(): Promise<void>;

    /**
     * Returns true if the specified key is mapped to some value in the cache.
     *
     * @param key The key whose presence in this cache is to be tested.
     *
     * @return A Promise that eventually resolves to true if the key is mapped
     *         to some value or false otherwise.
     */
    containsKey(key: K): Promise<boolean>;

    /**
     * Returns true if the specified value is mapped to some key.
     *
     * @param value The value expected to be associated with some key.
     *
     * @return A Promise that eventually resolves to true if a mapping
     *         exists or false otherwise.
     */
    containsValue(value: V): Promise<boolean>;

    /**
     * Returns the value to which this cache maps the specified key.
     *
     * @param key The key whose associated value is to be returned.
     *
     * @return A Promise that will eventually resolve to the value that
     *         is associated with the specified key.
     */
    get(key: K): Promise<V | null>;

    /**
     * Returns the value to which the specified key is mapped, or
     * the specified defaultValue if this map contains no mapping for the key.
     */
    getOrDefault(key: K, defaultValue: V): Promise<V | null>;

    /**
     * Checks if this map is empty or not.
     *
     * @return A Promise that eventually resolves to true if the map is empty;
     *         false otherwise.
     */
    isEmpty(): Promise<boolean>;

    /**
     * Associates the specified value with the specified key in this map. If the
     * map previously contained a mapping for this key, the old value is replaced.
     *
     * @param key The key with which the specified value is to be associated.
     * @param value The value to be associated with the specified key.
     * @param ttl The expiry time in millis.
     *
     * @return A Promise that will eventually resolve to the previous value that
     *         was associated with the specified key.
     */
    put(key: K, value: V, ttl?: number): Promise<V>;

    /**
     * Remove the value to which this cache maps the specified key.
     *
     * @param key the key whose associated value is to be removed
     *
     * @return a Promise that will eventually resolve to the value that
     * is associated with the specified key.
     */
    remove(key: K): Promise<V>;

    /**
     * Remove the mapping only if the cache contains the specified mapping.
     *
     * @param key the key whose associated value is to be removed
     * @param value the value that must be associated with the specified key
     *
     * @return a Promise that will eventually resolve to true if the specifiedf
     *         mapping exists in the cache; false otherwise
     */
    removeMapping(key: K, value: V): Promise<boolean>

    /**
     * Replace the entry for the specified key only if it is currently
     * mapped to some value.
     *
     * @param key the key whose associated value is to be removed
     * @param value the value to be replaced.
     * 
     * @return a Promise that will eventually resolve to the value that
     * is associated with the specified key.
     */
    replace(key: K, value: V): Promise<V>;

    /**
     * Replace the mapping for the specified key with the newValue but only if 
     * currently mapped to the specified value.
     *
     * @param key the key whose associated value is to be removed
     * @param value the current value that must be associated with the specified key
     * @param newValue the new value that to be associated with the specified key
     *
     * @return a Promise that will eventually resolve to true if the specifiedf
     *         mapping exists in the cache; false otherwise
     */
    replaceMapping(key: K, value: V, newValue: V): Promise<boolean>;

    /**
     * Returns the number of key-value mappings in this map.
     *
     * @return A Promise that will eventually resolve to the number of key-value
     *         mappings in this map.
     */
    size(): Promise<number>;

}