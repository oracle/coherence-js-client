// Reference mocha-typescript's global definitions:
/// <reference path='../node_modules/mocha-typescript/globals.d.ts' />

import { NamedCacheClient } from '../src/cache/named_cache_client'
import { KeyAssociatedFilter } from '../src/filter/filter';

export const cache = new NamedCacheClient<any, any>('FilterTestsCache');
export const nested = new NamedCacheClient<any, any>('NestedObjectCache');

export const val123 = {id: 123, str: '123', ival: 123, fval: 12.3, iarr: [1, 2, 3]};
export const val234 = {id: 234, str: '234', ival: 234, fval: 23.4, iarr: [2, 3, 4], nullIfOdd: 'non-null'};
export const val345 = {id: 345, str: '345', ival: 345, fval: 34.5, iarr: [3, 4, 5]};
export const val456 = {id: 456, str: '456', ival: 456, fval: 45.6, iarr: [4, 5, 6], nullIfOdd: 'non-null'};

export const toObj = {t: {o: {level: 3, word: 'To', tokens: ['t', 'o']}}};
export const tscObj = {t: {y: {level: 3, word: 'TypeScript', tokens: ['t', 'y']}}};
export const trieObj = {t: {r: {level: 3, word: 'Trie', tokens: ['t', 'r']}}};
export const jadeObj = {j: {a: {d: {level: 4, word: 'Jade', tokens: ['j', 'a', 'd']}}}};
export const javascriptObj = {j: {a: {level: 4, v: {word: 'JavaScript', tokens: ['j', 'a', 'v']}}}};

export class AbstractNamedCacheTestsSuite {
    async before() {
        await cache.clear();
        
        await cache.put("123", val123)
        await cache.put("234", val234)
        await cache.put("345", val345)
        await cache.put("456", val456)

        await nested.put('To', toObj);
        await nested.put('TypeScript', tscObj);
        await nested.put('Trie', trieObj);
        await nested.put('Jade', jadeObj);
        await nested.put('JavaScript', javascriptObj);
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

    // async checkFilter(filter: Filter, expectedKeys: Array<any>, expectedValues: Array<any>) {
    //     const keys = await cache.keySet(filter);
    //     expect(keys.size).to.equal(expectedKeys.length);
    //     expect(Array.from(keys)).to.have.deep.members(expectedKeys);

    //     const entries = await cache.entrySet(filter);
    //     expect(entries.size).to.equal(expectedValues.length);
    //     expect(this.entriesToKeys(entries)).to.have.deep.members(expectedKeys);
    //     expect(this.entriesToValues(entries)).to.have.deep.members(expectedValues);  
        
    //     const values = await cache.values(filter);
    //     expect(values.size).to.equal(expectedValues.length);
    //     expect(Array.from(values)).to.have.deep.members(expectedValues);
    // }
}

