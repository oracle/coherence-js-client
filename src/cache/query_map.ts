import { ValueExtractor } from '../extractor/value_extractor';
import { ContainsAnyFilter } from '../filter/contains_any_filter';
import { Filter } from '../filter/filter';
import { NamedCacheEntry } from './streamed_collection';
import { Comparator } from './request_factory';


export interface Entry<K, V> {
     
    /**
     * Returns the key corresponding to this entry.    
     */
    getKey(): K;

    /**
     * Returns the value corresponding to this entry.    
     */
    getValue(): V;
}


export interface RemoteSet<T> {
    clear(): Promise<void>;
    delete(value: T): Promise<boolean>;
    has(value: T): Promise<boolean>;
    size(): Promise<number>;
    [Symbol.iterator](): IterableIterator<T>
}


export interface QueryMap<K, V> {

    /**
     * Add an index to this QueryMap.
     * 
     * @remarks
     * Adds an index to this QueryMap. Example:
     * ```ts
     * cache.addIndex(Extractors.extract('name'));
     * ```
     * 
     * @param extractor  - The ValueExtractor object that is used to extract 
     *                     an indexable Object from a value stored in the 
     *                     indexed Map. Must not be null.
     * @param ordered    - true iff the contents of the indexed information 
     *                     should be ordered; false otherwise.
     * @param comparator - The Comparator object which imposes an ordering 
     *                     on entries in the indexed map; or null if the 
     *                     entries' values natural ordering should be used. 
     * @typeparam <T>    - The type of the value to extract from.
     * @typeparam <E>    - The type of value that will be extracted.
     * 
     * @returns            A Promise<void> that resolves when the operation 
     *                     completes.
     */
    addIndex<T, E>(extractor: ValueExtractor<T, E>, ordered?: boolean, comparator?: ContainsAnyFilter<T, E>): Promise<void>;

    /**
     * Returns a {@link Set} view of the keys contained in this map.
     * The set is backed by the map, so changes to the map are
     * reflected in the set, and vice-versa.  If the map is modified
     * while an iteration over the set is in progress (except through
     * the iterator's own <tt>remove</tt> operation), the results of
     * the iteration are undefined.  The set supports element removal,
     * which removes the corresponding mapping from the map, via the
     * <tt>Iterator.remove</tt>, <tt>Set.remove</tt>,
     * <tt>removeAll</tt>, <tt>retainAll</tt>, and <tt>clear</tt>
     * operations.  It does not support the <tt>add</tt> or <tt>addAll</tt>
     * operations.
     *
     * @return a set view of the keys contained in this map
     */
    keySet(): RemoteSet<K>;
        
    /**
     * Return a set view of the keys contained in this map for entries that
     * satisfy the criteria expressed by the filter.
     * <p>
     * Unlike the {@link keySet()} method, the set returned by this method may
     * not be backed by the map, so changes to the set may not reflected in the
     * map, and vice-versa.
     * <p>
     * <b>Note: When using the Coherence Enterprise Edition or Grid Edition, the
     * Partitioned Cache implements the QueryMap interface using the Parallel
     * Query feature. When using Coherence Standard Edition, the Parallel Query
     * feature is not available, resulting in lower performance for most
     * queries, and particularly when querying large data sets.</b>
     *
     * @param filter the Filter object representing the criteria that the
     *               entries of this map should satisfy
     *
     * @return a set of keys for entries that satisfy the specified criteria
     */
    keySet(filter: Filter<any>, comparator?: Comparator): Promise<Set<K>>;

    /**
     * Remove an index from this QueryMap.
     * 
     * @remarks
     * Removes an index to this QueryMap. Example:
     * ```ts
     * cache.removeIndex(Extractors.extract('name'));
     * ```
     * 
     * @param extractor - The ValueExtractor object that is used to extract 
     *                    an indexable Object from a value stored in the 
     *                    indexed Map. Must not be null.
     * @typeparam <T>   - The type of the value to extract from.
     * @typeparam <E>   - The type of value that will be extracted.  
     * 
     * @returns           A Promise<void> that resolves when the operation 
     *                    completes.
     */
    removeIndex<T, E>(extractor: ValueExtractor<T, E>): Promise<void>;

}