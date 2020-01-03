import { ValueExtractor } from '../extractor/value_extractor';
import { ContainsAnyFilter } from '../filter/contains_any_filter';
import { Filter } from '../filter/filter';
import { NamedCacheEntry } from './streamed_collection';
import { Comparator } from './request_factory';

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