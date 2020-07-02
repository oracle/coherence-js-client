/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { suite, test, timeout } from '@testdeck/mocha'

import { NamedCacheClient } from '../src/cache/named_cache_client'
import { SessionBuilder } from '../src/cache/session'

import { Extractors } from '../src/extractor/extractors'
import { Filters } from '../src/filter/filters'

export const assert = require('assert').strict;
export const session = new SessionBuilder().build()

describe('Extractor IT Test Suite', () => {
  let nested: NamedCacheClient

  const val123 = {id: 123, str: '123', ival: 123, fval: 12.3, iarr: [1, 2, 3]}
  const val234 = {id: 234, str: '234', ival: 234, fval: 23.4, iarr: [2, 3, 4], nullIfOdd: 'non-null'}
  const val345 = {id: 345, str: '345', ival: 345, fval: 34.5, iarr: [3, 4, 5]}
  const val456 = {id: 456, str: '456', ival: 456, fval: 45.6, iarr: [4, 5, 6], nullIfOdd: 'non-null'}

  const toObj = {t: {o: {level: 3, word: 'To', tokens: ['t', 'o']}}}
  const tscObj = {t: {y: {level: 3, word: 'TypeScript', tokens: ['t', 'y']}}}
  const trieObj = {t: {r: {level: 3, word: 'Trie', tokens: ['t', 'r']}}}
  const jadeObj = {j: {a: {d: {level: 4, word: 'Jade', tokens: ['j', 'a', 'd']}}}}
  const javascriptObj = {j: {a: {level: 4, v: {word: 'JavaScript', tokens: ['j', 'a', 'v']}}}}

  class ExtractorTestSuiteBase {
    public static before () {
      nested = session.getCache('nested-cache')
    }

    public static after () {
      nested.release()
    }

    protected static async populateCache (cache: NamedCacheClient) {
      await cache.put('To', toObj)
      await cache.put('TypeScript', tscObj)
      await cache.put('Trie', trieObj)
      await cache.put('Jade', jadeObj)
      await cache.put('JavaScript', javascriptObj)
    }

    public async before () {
      await nested.clear()
      await ExtractorTestSuiteBase.populateCache(nested)
    }

    protected toArrayUsing<K> (entries: Set<any>, fn: (e: any) => K): Array<K> {
      const keys: Array<K> = new Array<K>()
      for (const entry of entries) {
        keys.push(fn(entry))
      }
      return keys
    }

    protected entriesToKeys<K> (entries: Set<any>): Set<K> {
      return new Set<K>(this.toArrayUsing(entries, (e) => e.getKey()))
    }

    protected entriesToValues<V> (entries: Set<any>): Set<V> {
      return new Set<V>(this.toArrayUsing(entries, (e) => e.getValue()))
    }
  }

  @suite(timeout(3000))
  class ExtractorTestsSuite
    extends ExtractorTestSuiteBase {
    // ChainedExtractor
    @test
    async testChainedExtractorWithKeySet () {
      const f1 = Filters.equal(Extractors.chained(
        Extractors.extract('t'), Extractors.extract('r'), Extractors.extract('word')), 'Trie')
      const entries = await nested.entrySet(f1)

      assert.equal(entries.size, 1)
      assert.deepEqual(this.entriesToKeys(entries), new Set(['Trie']))
      assert.deepEqual(this.entriesToValues(entries), new Set([trieObj]))
    }

    @test
    async testChainedExtractorWithEntrySet () {
      const f1 = Filters.equal(Extractors.chained(
        Extractors.extract('j'), Extractors.extract('a'), Extractors.extract('v'), Extractors.extract('word')), 'JavaScript')
      const f2 = f1.or(Filters.equal(Extractors.chained(
        Extractors.extract('j'), Extractors.extract('a'), Extractors.extract('d'), Extractors.extract('word')), 'Jade'))
      const entries = await nested.entrySet(f2)

      assert.equal(entries.size, 2)
      assert.deepEqual(this.entriesToKeys(entries), new Set(['JavaScript', 'Jade']))
      assert.deepEqual(this.entriesToValues(entries), new Set([javascriptObj, jadeObj]))
    }

    @test
    async testChainedExtractorWithValues () {
      const f1 = Filters.equal(Extractors.chained(
        Extractors.extract('j'), Extractors.extract('a'), Extractors.extract('v'), Extractors.extract('word')), 'JavaScript')
      const f2 = f1.or(Filters.equal(Extractors.chained(
        Extractors.extract('j'), Extractors.extract('a'), Extractors.extract('d'), Extractors.extract('word')), 'Jade'))
      const values = await nested.values(f2)

      assert.equal(values.size, 2)
      assert.deepEqual(values, new Set([javascriptObj, jadeObj]))
    }

    @test
    async testChainedExtractorWithFieldNamesWithKeySet () {
      const f1 = Filters.equal(Extractors.chained('t.r.word'), 'Trie')
      const entries = await nested.entrySet(f1)

      assert.equal(entries.size, 1)
      assert.deepEqual(this.entriesToKeys(entries), new Set(['Trie']))
      assert.deepEqual(this.entriesToValues(entries), new Set([trieObj]))
    }

    @test
    async testChainedExtractorWithFieldNamesWithEntrySet () {
      const f1 = Filters.equal(Extractors.chained('j.a.v.word'), 'JavaScript')
      const f2 = f1.or(Filters.equal(Extractors.chained('j.a.d.word'), 'Jade'))
      const entries = await nested.entrySet(f2)

      assert.equal(entries.size, 2)
      assert.deepEqual(this.entriesToKeys(entries), new Set(['JavaScript', 'Jade']))
      assert.deepEqual(this.entriesToValues(entries), new Set([javascriptObj, jadeObj]))
    }

    @test
    async testChainedExtractorWithFieldNamesWithValues () {
      const f1 = Filters.equal(Extractors.chained('j.a.v.word'), 'JavaScript')
      const f2 = f1.or(Filters.equal(Extractors.chained('j.a.d.word'), 'Jade'))
      const values = await nested.values(f2)

      assert.equal(values.size, 2)
      assert.deepEqual(values, new Set([javascriptObj, jadeObj]))
    }
  }

  @suite(timeout(3000))
  class UniversalExtractorSuite
    extends ExtractorTestSuiteBase {
    static cache: NamedCacheClient

    public static async before () {
      const cache = session.getCache('univ-cache')
      UniversalExtractorSuite.cache = cache

      await cache.put('123', val123)
      await cache.put('234', val234)
      await cache.put('345', val345)
      await cache.put('456', val456)
    }

    public static after () {
      UniversalExtractorSuite.cache.release()
    }

    // UniversalExtractor
    @test
    async testUniversalExtractorWithArrayContainsWithKeySet () {
      const f1 = Filters.arrayContains(Extractors.extract('iarr'), 3)
      const keys = await UniversalExtractorSuite.cache.keySet(f1)

      assert.equal(keys.size, 3)
      assert.deepEqual(keys, new Set(['123', '234', '345']))
    }

    @test
    async testUniversalExtractorWithArrayContainsWithEntrySet () {
      const f1 = Filters.arrayContains(Extractors.extract('iarr'), 3)
      const entries = await UniversalExtractorSuite.cache.entrySet(f1)
      assert.equal(entries.size, 3)
      assert.deepEqual(this.entriesToKeys(entries), new Set(['123', '234', '345']))
      assert.deepEqual(this.entriesToValues(entries), new Set([val123, val234, val345]))
    }

    @test
    async testUniversalExtractorWithArrayContainsWithValues () {
      const f1 = Filters.arrayContains(Extractors.extract('iarr'), 3)
      const entries = await UniversalExtractorSuite.cache.values(f1)

      assert.equal(entries.size, 3)
      assert.deepEqual(entries, new Set([val123, val234, val345]))
    }
  }
})
