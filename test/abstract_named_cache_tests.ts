// Reference mocha-typescript's global definitions:
/// <reference path='../node_modules/mocha-typescript/globals.d.ts' />

import { NamedCacheClient } from '../src/cache/named_cache_client'

export const val123 = {id: 123, str: '123', ival: 123, fval: 12.3, iarr: [1, 2, 3]};
export const val234 = {id: 234, str: '234', ival: 234, fval: 23.4, iarr: [2, 3, 4], nullIfOdd: 'non-null'};
export const val345 = {id: 345, str: '345', ival: 345, fval: 34.5, iarr: [3, 4, 5]};
export const val456 = {id: 456, str: '456', ival: 456, fval: 45.6, iarr: [4, 5, 6], nullIfOdd: 'non-null'};

export const toObj = {t: {o: {level: 3, word: 'To', tokens: ['t', 'o']}}};
export const tscObj = {t: {y: {level: 3, word: 'TypeScript', tokens: ['t', 'y']}}};
export const trieObj = {t: {r: {level: 3, word: 'Trie', tokens: ['t', 'r']}}};
export const jadeObj = {j: {a: {d: {level: 4, word: 'Jade', tokens: ['j', 'a', 'd']}}}};
export const javascriptObj = {j: {a: {level: 4, v: {word: 'JavaScript', tokens: ['j', 'a', 'v']}}}};

export const versioned123 = {'@version': 1, id: 123, str: '123', ival: 123, fval: 12.3, iarr: [1, 2, 3]};
export const versioned234 = {'@version': 2, id: 234, str: '234', ival: 234, fval: 23.4, iarr: [2, 3, 4], nullIfOdd: 'non-null'};
export const versioned345 = {'@version': 3, id: 345, str: '345', ival: 345, fval: 34.5, iarr: [3, 4, 5]};
export const versioned456 = {'@version': 4, id: 456, str: '456', ival: 456, fval: 45.6, iarr: [4, 5, 6], nullIfOdd: 'non-null'};

export class AbstractNamedCacheTestsSuite {

    cache: NamedCacheClient<any, any> = new NamedCacheClient<any, any>('JSClientCache');
    nested: NamedCacheClient<any, any> = new NamedCacheClient<any, any>('JSClientNestedCache');
    versioned: NamedCacheClient<any, any> = new NamedCacheClient<any, any>('JSClientVersionedCache');

    // constructor() {
    //     let cacheNamePrefix = this.constructor.name + "-";
    //     this.cache = new NamedCacheClient<any, any>(cacheNamePrefix + 'JSClientCache');
    //     this.nested = new NamedCacheClient<any, any>(cacheNamePrefix + 'JSClientNestedCache');
    // }

    async before() {

        await this.cache.clear();
        
        await this.cache.put("123", val123)
        await this.cache.put("234", val234)
        await this.cache.put("345", val345)
        await this.cache.put("456", val456)

        await this.nested.put('To', toObj);
        await this.nested.put('TypeScript', tscObj);
        await this.nested.put('Trie', trieObj);
        await this.nested.put('Jade', jadeObj);
        await this.nested.put('JavaScript', javascriptObj);
        
        await this.versioned.put("123", versioned123)
        await this.versioned.put("234", versioned234)
        await this.versioned.put("345", versioned345)
        await this.versioned.put("456", versioned456)
    }

    protected toArrayUsing<K>(entries: Set<any>, fn: (e: any) => K): Array<K> {
        let keys: Array<K> = new Array<K>();
        for (let entry of entries) {
            keys.push(fn(entry));
        }
        return keys;
    }

    protected entriesToKeys<K>(entries: Set<any>): Array<K> {
        return this.toArrayUsing(entries, (e) => e.getKey());
    }

    protected entriesToValues<K>(entries: Set<any>): Array<K> {
        return this.toArrayUsing(entries, (e) => e.getValue());
    }

    protected toEntries(entries: Set<any>): Array<{key: any, value: any}> {
        let array: Array<any> = new Array<any>();
        for (let entry of entries) {
            array.push({key: entry.getKey(), value: entry.getValue()});
        }

        return array
    }

    protected extractKeysAndValues(map: Map<any, any>): {keys: Array<any>, values: Array<any>} {
        const keys = new Array<any>();
        const values = new Array<any>();

        for (let [key, value] of map) {
            keys.push(key);
            values.push(value);
        }
        return {keys, values};
    }

    // async checkFilter(filter: Filter, expectedKeys: Array<any>, expectedValues: Array<any>) {
    //     const keys = await this.cache.keySet(filter);
    //     expect(keys.size).to.equal(expectedKeys.length);
    //     expect(Array.from(keys)).to.have.deep.members(expectedKeys);

    //     const entries = await this.cache.entrySet(filter);
    //     expect(entries.size).to.equal(expectedValues.length);
    //     expect(this.entriesToKeys(entries)).to.have.deep.members(expectedKeys);
    //     expect(this.entriesToValues(entries)).to.have.deep.members(expectedValues);  
        
    //     const values = await this.cache.values(filter);
    //     expect(values.size).to.equal(expectedValues.length);
    //     expect(Array.from(values)).to.have.deep.members(expectedValues);
    // }
}

