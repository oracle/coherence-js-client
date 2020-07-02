/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { suite, test, timeout } from '@testdeck/mocha'
import { Aggregators } from '../src/aggregator/aggregators'
import { NamedCacheClient } from '../src/cache/named_cache_client'
import { SessionBuilder } from '../src/cache/session'

import { Extractors } from '../src/extractor/extractors'
import { Filters } from '../src/filter/filters'

import { Processors } from '../src/processor/processors'

import { val123, val234, val345, val456 } from './abstract_named_cache_tests'

export const assert = require('assert').strict;
export const session = new SessionBuilder().build()

describe('NamedCacheClient IT Test Suite', () => {
  let cache: NamedCacheClient

  class ClientTestSuiteBase {
    public static async before () {
      cache = session.getCache('client-cache')
      await cache.clear()
      await ClientTestSuiteBase.populateCache(cache)
    }

    public static after () {
      cache.release()
    }

    protected static async populateCache (cache: NamedCacheClient) {
      await cache.put('123', val123)
      await cache.put('234', val234)
      await cache.put('345', val345)
      await cache.put('456', val456)
    }

    protected extractKeysAndValues (map: Map<any, any>): { keys: Array<any>, values: Array<any> } {
      const keys = new Array<any>()
      const values = new Array<any>()

      for (const [key, value] of map) {
        keys.push(key)
        values.push(value)
      }
      return {keys, values}
    }
  }

  @suite(timeout(15000))
  class ClearSuite {
    public static async before () {
      cache = session.getCache('clear-cache')
      await cache.clear()
    }

    public static after () {
      cache.release()
    }

    @test
    async checkEmpty () {
      assert.equal(await cache.isEmpty(), true)
    }

    @test
    async checkSize () {
      assert.equal(await cache.size(), 0)
    }

    @test
    async checkGet () {
      assert.equal(await cache.get('123'), null)
    }

    @test
    async checkClear () {
      await cache.clear();
      assert.equal(await cache.isEmpty(), true)
    }

    @test
    async containsKeyOnEmptyMap () {
      assert.equal(await cache.containsKey('123'), false)
    }

    @test
    async containsValueOnEmptyMap () {
      assert.equal(await cache.containsValue(val123), false)
    }

    @test
    async getOnEmptyMap () {
      assert.equal(await cache.get('123'), null)
    }

    @test
    async testOnEmptyMap () {
      const result = await cache.getAll(['123'])
      assert.deepEqual(Array.from(result), [])
    }

    @test
    async getOrDefaultOnEmptyMap () {
      const value = {valid: 'yes'}
      assert.equal(await cache.getOrDefault('123abc', value), value)
    }
  }

  describe('NamedCacheClient API Test Suite', () => {
    @suite(timeout(30000))
    class AggregateSuite
      extends ClientTestSuiteBase {
      @test
      async checkMinAggregator () {
        const result = await cache.aggregate(Aggregators.min('id'))
        assert.equal(result, 123)
      }

      @test
      async checkMaxAggregator () {
        const result = await cache.aggregate(Aggregators.max('id'))
        assert.equal(result, 456)
      }

      @test
      async checkAvgAggregator () {
        const result = await cache.aggregate(Aggregators.average('id'))
        assert.equal(Number(result), 289.5);
      }
    }

    @suite(timeout(3000))
    class AddIndexSuite
      extends ClientTestSuiteBase {
      @test
      async checkSize () {
        assert.equal(await cache.size(), 4)
      }

      @test
      async addIndexOnInt () {
        await cache.addIndex(Extractors.extract('id'))
      }

      @test
      async addIndexOnStr () {
        await cache.addIndex(Extractors.extract('str'))
      }

      @test
      async addIndexOnFloatField () {
        await cache.addIndex(Extractors.extract('fval'))
      }
    }

    @suite(timeout(3000))
    class ContainsEntrySuite
      extends ClientTestSuiteBase {
      @test
      async checkSize () {
        assert.equal(await cache.size(), 4);
      }

      @test
      async containsEntryOnEmptyMap () {
        await cache.clear()
        assert.equal(await cache.containsEntry('123', val123), false);
      }

      @test
      async containsEntryOnExistingMapping () {
        await ClientTestSuiteBase.populateCache(cache)
        assert.equal(await  cache.size(), 4)
        assert.equal(await cache.containsEntry('123', val123), true);
      }

      @test
      async containsEntryOnNonExistingMapping () {
        assert.equal(await cache.containsEntry('345', {id: 123, str: '123'}), false)
      }

      @test
      async containsEntryWithComplexKey () {
        await cache.clear().then(await cache.put(val123, val234))
        assert.equal(await cache.containsEntry(val123, val234), true)
      }
    }

    @suite(timeout(3000))
    class ContainsKeySuite
      extends ClientTestSuiteBase {
      @test
      async containsKeyOnExistingMapping () {
        assert.equal(await cache.containsKey('123'), true)
      }

      @test
      async containsKeyOnNonExistingMapping () {
        assert.equal(await cache.containsKey('34556'), false)
      }

      @test
      async containsKeyWithComplexKey () {
        await cache.put(val123, val234)
        assert.equal(await cache.containsKey(val123), true)
      }
    }

    @suite(timeout(3000))
    class ContainsValueSuite
      extends ClientTestSuiteBase {
      @test
      async containsValueOnExistingMapping () {
        assert.equal(await cache.containsValue(val123), true)
      }

      @test
      async containsValueOnNonExistingMapping () {
        assert.equal(await cache.containsValue({id: 123, name: 'abc'}), false)
      }
    }

    @suite(timeout(3000))
    class GetSuite
      extends ClientTestSuiteBase {
      @test
      async getOnExistingMapping () {
        assert.deepEqual(await cache.get('123'), val123)
        assert.deepEqual(await cache.get('456'), val456)
      }

      @test
      async getOnNonExistingMapping () {
        assert.equal(await cache.get({id: 123, name: 'abc'}), null)
        assert.equal(await cache.get('123456'), null)
      }
    }

    @suite(timeout(3000))
    class GetAllTestsSuite
      extends ClientTestSuiteBase {
      @test
      async testWithEmptyKeys () {
        assert.equal(await cache.size(), 4)
        const result = await cache.getAll([])
        assert.equal(result.size, 0)
        assert.equal(await cache.size(), 4)
        assert.deepEqual(Array.from(result), [])
      }

      @test
      async testWithExistingKeys () {
        assert.equal(await cache.size(), 4)
        const entries = await cache.getAll(['123', '234', '345'])

        assert.equal(entries.size, 3)
        assert.deepEqual(new Set(Array.from(entries.keys())), new Set(['123', '234', '345']))
        assert.deepEqual(new Set(Array.from(entries.values())), new Set([val123, val234, val345]))
      }
    }

    @suite(timeout(3000))
    class GetOrDefaultSuite
      extends ClientTestSuiteBase {
      dVal: any = {id: 1234, name: '1234'}

      @test
      async getOrDefaultOnExistingMapping () {
        assert.deepEqual(await cache.getOrDefault('123', this.dVal), val123)
      }

      @test
      async getOnNonExistingMapping () {
        assert.deepEqual(await cache.getOrDefault({id: 123, name: 'abc'}, this.dVal), this.dVal)
      }
    }

    @suite(timeout(3000))
    class PutSuite
      extends ClientTestSuiteBase {
      @test
      async putOnEmptyMap () {
        await cache.clear()
        assert.equal(await cache.put('123', val123), null)
      }

      @test
      async getOnExistingMapping () {
        assert.deepEqual(await cache.put('123', {id: 123}), val123)
        assert.deepEqual(await cache.get('123'), {id: 123})
        assert.deepEqual(await cache.put('123', val123), {id: 123})
        assert.deepEqual(await cache.get('123'), val123)
      }

      @test
      async getOnNonExistingMapping () {
        assert.equal(await cache.get('123456'),null)
      }
    }

    @suite(timeout(3000))
    class IsEmptySuite
      extends ClientTestSuiteBase {
      @test
      async checkSizeWhenIsEmptyIsFalse () {
        assert.equal(await cache.size(), 4)
        assert.equal(await cache.isEmpty(), false)
      }

      @test
      async checkSizeAndIsEmptyOnPut () {
        await cache.clear()
        assert.equal(await cache.size(), 0)
        assert.equal(await cache.isEmpty(), true)

        await cache.put(val123, val234)

        assert.equal(await cache.size(), 1)
        assert.equal(await cache.isEmpty(), false)
      }
    }

    @suite(timeout(3000))
    class InvokeSuite
      extends ClientTestSuiteBase {
      @test
      async invokeOnAnExistingKey () {
        assert.deepEqual(await cache.invoke('123', Processors.extract()), val123)
      }

      @test
      async invokeOnANonExistingKey () {
        assert.equal(await cache.invoke('123456', Processors.extract()), null)
      }
    }

    @suite(timeout(3000))
    class InvokeAllSuite
      extends ClientTestSuiteBase {
      @test
      async invokeAllWithKeys () {
        const requestKeys: Set<string> = new Set(['123', '234', '345', '456'])
        const result = await cache.invokeAll(requestKeys, Processors.extract())

        const {keys, values} = super.extractKeysAndValues(result)
        assert.deepEqual(new Set(Array.from(keys)), new Set(['345', '123', '234', '456']))
        assert.deepEqual(new Set(Array.from(values)), new Set([val123, val234, val345, val456]))
      }

      @test
      async invokeAllWithASubsetOfKeys () {
        const requestKeys: Set<string> = new Set(['234', '345'])
        const result = await cache.invokeAll(requestKeys, Processors.extract())

        const {keys, values} = super.extractKeysAndValues(result)
        assert.deepEqual(new Set(Array.from(keys)), new Set(Array.from(requestKeys)))
        assert.deepEqual(new Set(Array.from(values)), new Set([val234, val345]))
      }

      @test
      async invokeAllWithEmptyKeys () {
        const requestKeys: Set<string> = new Set([])
        const result = await cache.invokeAll(requestKeys, Processors.extract())

        const {keys, values} = super.extractKeysAndValues(result)
        assert.deepEqual(new Set(Array.from(keys)), new Set(['345', '123', '234', '456']))
        assert.deepEqual(new Set(Array.from(values)), new Set([val123, val234, val345, val456]))
      }

      @test
      async invokeAllWithAlwaysFilter () {
        const result = await cache.invokeAll(Filters.always(), Processors.extract())

        const {keys, values} = super.extractKeysAndValues(result)

        assert.equal(keys.length, 4)
        assert.equal(values.length, 4)

        assert.deepEqual(new Set(Array.from(keys)), new Set(['345', '123', '234', '456']))
        assert.deepEqual(new Set(Array.from(values)), new Set([val123, val234, val345, val456]))
      }
    }
  })
})
