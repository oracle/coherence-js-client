/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { NamedCacheClient } from '../src'

export const assert = require('assert').strict;

export const val123 = {id: 123, str: '123', ival: 123, fval: 12.3, iarr: [1, 2, 3], group: 1}
export const val234 = {id: 234, str: '234', ival: 234, fval: 23.4, iarr: [2, 3, 4], group: 2, nullIfOdd: 'non-null'}
export const val345 = {id: 345, str: '345', ival: 345, fval: 34.5, iarr: [3, 4, 5], group: 2}
export const val456 = {id: 456, str: '456', ival: 456, fval: 45.6, iarr: [4, 5, 6], group: 3, nullIfOdd: 'non-null'}

export const toObj = {t: {o: {level: 3, word: 'To', tokens: ['t', 'o']}}}
export const tscObj = {t: {y: {level: 3, word: 'TypeScript', tokens: ['t', 'y']}}}
export const trieObj = {t: {r: {level: 3, word: 'Trie', tokens: ['t', 'r']}}}
export const jadeObj = {j: {a: {d: {level: 4, word: 'Jade', tokens: ['j', 'a', 'd']}}}}
export const javascriptObj = {j: {a: {level: 4, v: {word: 'JavaScript', tokens: ['j', 'a', 'v']}}}}

export class TestUtil {
  static async populateCache (cache: NamedCacheClient) {
    await cache.put('123', val123)
    await cache.put('234', val234)
    await cache.put('345', val345)
    await cache.put('456', val456)
  }

  static toSetUsing<T> (entries: Set<any>, fn: (e: any) => T): Set<T> {
    const keys: Set<T> = new Set<T>()
    for (const entry of entries) {
      keys.add(fn(entry))
    }
    return keys
  }

  static entriesToKeys<K> (entries: Set<any>): Set<K> {
    return this.toSetUsing(entries, (e) => e.getKey())
  }

  static entriesToValues<V> (entries: Set<any>): Set<V> {
    return this.toSetUsing(entries, (e) => e.getValue())
  }

  static async validate (namedCache: NamedCacheClient,
                         expectedKeys: Array<any>, expectedValues: Array<any>) {
    for (let index = 0; index < expectedKeys.length; index++) {
      assert.deepEqual(await namedCache.get(expectedKeys[index]), expectedValues[index])
    }
  }
}
