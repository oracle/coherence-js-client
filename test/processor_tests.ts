/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { suite, test, timeout } from '@testdeck/mocha'
import { Extractors, Filters, NamedCacheClient, Processors, SessionBuilder } from '../src'
import { internal } from '../src/processor/package-internal'
import { internal as extint } from '../src/extractor/package-internal'

import {
  jadeObj,
  javascriptObj,
  TestUtil,
  toObj,
  trieObj,
  tscObj,
  val123,
  val234,
  val345,
  val456
} from './abstract_named_cache_tests'

export const assert = require('assert').strict
export const session = new SessionBuilder().build()

describe('processor.Processors IT Test Suite', () => {
  const versioned123 = {'@version': 1, id: 123, str: '123', ival: 123, fval: 12.3, iarr: [1, 2, 3]}
  const versioned234 = {
    '@version': 2,
    id: 234,
    str: '234',
    ival: 234,
    fval: 23.4,
    iarr: [2, 3, 4],
    nullIfOdd: 'non-null'
  }
  const versioned345 = {'@version': 3, id: 345, str: '345', ival: 345, fval: 34.5, iarr: [3, 4, 5]}
  const versioned456 = {
    '@version': 4,
    id: 456,
    str: '456',
    ival: 456,
    fval: 45.6,
    iarr: [4, 5, 6],
    nullIfOdd: 'non-null'
  }

  let cache: NamedCacheClient
  let nested: NamedCacheClient
  let versioned: NamedCacheClient

  class ExtractorProcessorTestsSuiteBase {
    public static async before () {
      cache = session.getCache('client-cache')
      nested = session.getCache('nested-cache')
      versioned = session.getCache('versioned-cache')
    }

    public static async after () {
      await cache.release()
      await nested.release()
      await versioned.release()
    }

    protected static async populateNestedCache () {
      await nested.clear()
      await nested.put('To', toObj)
      await nested.put('TypeScript', tscObj)
      await nested.put('Trie', trieObj)
      await nested.put('Jade', jadeObj)
      await nested.put('JavaScript', javascriptObj)

      await versioned.put('123', versioned123)
      await versioned.put('234', versioned234)
      await versioned.put('345', versioned345)
      await versioned.put('456', versioned456)
    }

    public async before () {
      await cache.clear()
      await TestUtil.populateCache(cache)
      await ExtractorProcessorTestsSuiteBase.populateNestedCache()
    }
  }

  // ExtractorProcessor
  @suite(timeout(3000))
  class ExtractorProcessorTestsSuite
    extends ExtractorProcessorTestsSuiteBase {
    @test
    testTypeNameOfExtractorProcessor () {
      const processor = Processors.extract('str')
      assert.equal(processor['@class'], internal.processorName('ExtractorProcessor'))
    }

    @test
    async testInvoke () {
      const processor = Processors.extract('id').andThen(Processors.extract('str'))
      const value = await cache.invoke('123', processor)

      assert.equal(value.length, 2)
      assert.deepEqual(value, [123, '123'])
    }

    @test
    async testInvokeAllWithKeys () {
      const processor = Processors.extract('id').andThen(Processors.extract('str'))
      const result = await cache.invokeAll(new Set(['123', '234']), processor)

      assert.equal(result.size, 2)
      assert.deepEqual(new Set(result.keys()), new Set(['123', '234']))
      assert.deepEqual(new Set(result.values()), new Set([[123, '123'], [234, '234']]))
    }

    @test
    async testInvokeAllWithFilter () {
      const processor = Processors.extract('id').andThen(Processors.extract('str'))
      const result = await cache.invokeAll(Filters.always(), processor)

      assert.equal(result.size, 4)
      assert.deepEqual(new Set(result.keys()), new Set(['123', '234', '345', '456']))
      assert.deepEqual(new Set(result.values()), new Set([[123, '123'], [234, '234'], [345, '345'], [456, '456']]))
    }

    @test
    async testInvokeAllWithExtractorFilter () {
      const processor = Processors.extract()
      const f1 = Filters.equal(Extractors.chained('j.a.v.word'), 'JavaScript')
        .or(Filters.equal(Extractors.chained('j.a.d.word'), 'Jade'))
      const result = await nested.invokeAll(f1, processor)

      assert.equal(Array.from(result.keys()).length, 2)
      assert.equal(Array.from(result.values()).length, 2)
      assert.deepEqual(new Set(result.keys()), new Set(['JavaScript', 'Jade']))
      assert.deepEqual(new Set(result.values()), new Set([javascriptObj, jadeObj]))
    }
  }

  // CompositeProcessor
  @suite(timeout(3000))
  class CompositeProcessorTestsSuite
    extends ExtractorProcessorTestsSuiteBase {
    @test
    testTypeName () {
      const ep = Processors.extract('id')
      assert.equal(ep['@class'], internal.processorName('ExtractorProcessor'))

      const cp = ep.andThen(Processors.extract('str'))
        .andThen(Processors.extract('iVal'))
      assert.equal(cp['@class'], internal.processorName('CompositeProcessor'))
    }

    @test
    async testInvoke () {
      const processor = Processors.extract('id').andThen(Processors.extract('str'))
      const value = await cache.invoke('123', processor)

      assert.equal(value.length, 2)
      assert.deepEqual(value, [123, '123'])
    }

    @test
    async testInvokeAllWithContainsAnyFilter () {
      const filter = Filters.arrayContainsAny(Extractors.extract('iarr'), [1, 2])
      const processor = Processors.extract('id').andThen(Processors.extract('str'))
      const result = await cache.invokeAll(filter, processor)
      //        expect(Array.from(result.keys())).to.have.deep.members(['123', '234', '345', '456']);

      assert.equal(Array.from(result).length, 2)
      assert.deepEqual(new Set(result.keys()), new Set(['123', '234']))
      assert.deepEqual(new Set(result.values()), new Set([[123, '123'], [234, '234']]))
    }

    @test
    async testInvokeAllWithContainsAllFilter () {
      const filter = Filters.arrayContainsAll(Extractors.extract('iarr'), [2, 4])
      const processor = Processors.extract('id').andThen(Processors.extract('str'))
      const result = await cache.invokeAll(filter, processor)

      assert.equal(Array.from(result).length, 1)
      assert.deepEqual(new Set(result.keys()), new Set(['234']))
      assert.deepEqual(new Set(result.values()), new Set([[234, '234']]))
    }
  }

  // ConditionalProcessor
  @suite(timeout(3000))
  class ConditionalProcessorTestsSuite
    extends ExtractorProcessorTestsSuiteBase {
    @test
    testTypeName () {
      const ep = Processors.extract('str')
        .when(Filters.arrayContainsAll(Extractors.extract('iarr'), [1, 2]))

      assert.equal(ep['@class'], internal.processorName('ConditionalProcessor'))
    }

    @test
    async testInvokeWithKey () {
      const ep = Processors.extract('str')
        .when(Filters.arrayContainsAll(Extractors.extract('iarr'), [1, 2]))
      const value = await cache.invoke('123', ep)

      assert.equal(value, '123')
    }

    @test
    async testInvokeAllWithMultipleKeys () {
      const ep = Processors.extract('str')
        .when(Filters.arrayContainsAny(Extractors.extract('iarr'), [2, 3]))
      const value = await cache.invokeAll(new Set(['234', '345', '456']), ep)

      assert.deepEqual(Array.from(value.keys()), ['234', '345'])
      assert.deepEqual(Array.from(value.values()), ['234', '345'])
    }
  }

  // ConditionalPutProcessor
  @suite(timeout(3000))
  class ConditionalPutProcessorTestsSuite
    extends ExtractorProcessorTestsSuiteBase {
    @test
    testTypeName () {
      const ep = Processors.conditionalPut(Filters.always(), 'someValue')

      assert.equal(ep['@class'], internal.processorName('ConditionalPut'))
      assert.equal(ep.doesReturnValue(), true)
      assert.equal(ep.getValue(), 'someValue')
    }

    @test
    async testInvoke () {
      const f1 = Filters.arrayContainsAll(Extractors.extract('iarr'), [1, 2])
      const ep = Processors.conditionalPut(f1, val234).returnCurrent()
      await cache.invoke('123', ep)

      assert.deepEqual(await cache.get('123'), val234)
      assert.deepEqual(await cache.get('234'), val234)
      assert.deepEqual(await cache.get('345'), val345)
      assert.deepEqual(await cache.get('456'), val456)
    }

    @test
    async testInvokeAllWithFilter () {
      const f1 = Filters.arrayContainsAny(Extractors.extract('iarr'), [1, 2])
      const ep = Processors.conditionalPut(Filters.always(), val234).returnCurrent()

      await cache.invokeAll(f1, ep)

      assert.deepEqual(await cache.get('123'), val234)
      assert.deepEqual(await cache.get('234'), val234)
      assert.deepEqual(await cache.get('345'), val345)
      assert.deepEqual(await cache.get('456'), val456)
    }
  }

  // ConditionalPutAllProcessor
  @suite(timeout(3000))
  class ConditionalPutAllProcessorTestsSuite
    extends ExtractorProcessorTestsSuiteBase {
    @test
    testTypeNameOf () {
      const ep = Processors.conditionalPutAll(Filters.always(), new Map())
      assert.equal(ep['@class'], internal.processorName('ConditionalPutAll'))
    }

    @test
    async testInvokeAllWithJustProcessor () {
      const values = new Map()
      values.set('123', val234)
      values.set('345', val456)
      const ep = Processors.conditionalPutAll(Filters.always(), values)

      await cache.invokeAll(ep)

      assert.deepEqual(await cache.get('123'), val234)
      assert.deepEqual(await cache.get('234'), val234)
      assert.deepEqual(await cache.get('345'), val456)
      assert.deepEqual(await cache.get('456'), val456)
    }

    @test
    async testInvokeAllWithFilter () {
      const values = new Map()
      values.set('123', val234)
      values.set('345', val456)
      const ep = Processors.conditionalPutAll(Filters.arrayContainsAny(Extractors.extract('iarr'), [1, 2]), values)

      await cache.invokeAll(Filters.always(), ep)

      assert.deepEqual(await cache.get('123'), val234)
      assert.deepEqual(await cache.get('234'), val234)
      assert.deepEqual(await cache.get('345'), val345)
      assert.deepEqual(await cache.get('456'), val456)
    }

    @test
    async testInvokeAllWithKeys () {
      const values = new Map()
      values.set('123', val234)
      values.set('345', val456)
      const filter = Filters.arrayContainsAny(Extractors.extract('iarr'), [1, 2])
      const ep = Processors.conditionalPutAll(filter, values)

      await cache.invokeAll(['123', '234', '345', '456'], ep)

      assert.deepEqual(await cache.get('123'), val234)
      assert.deepEqual(await cache.get('234'), val234)
      assert.deepEqual(await cache.get('345'), val345)
      assert.deepEqual(await cache.get('456'), val456)
    }

    @test
    async testIfExistingEntriesCanBeUpdated () {
      const newVal1 = {id: 123456, str: '123456', ival: 123456, fval: 123.456, iarr: [1, 2, 3, 4, 5, 6]}
      const newVal2 = {id: 234567, str: '234567', ival: 234567, fval: 234.567, iarr: [2, 3, 4, 5, 6, 7]}

      const values = new Map()
      values.set('123', newVal1)
      values.set('234', newVal2)
      values.set('2-123', newVal1)
      values.set('2-234', newVal2)
      const ep = Processors.conditionalPutAll(Filters.present(), values)

      await cache.invokeAll(ep)

      assert.deepEqual(await cache.get('123'), newVal1)
      assert.deepEqual(await cache.get('234'), newVal2)
      assert.deepEqual(await cache.get('345'), val345)
      assert.deepEqual(await cache.get('456'), val456)
      assert.equal(await cache.get('2-123'), null)
      assert.equal(await cache.get('2-234'), null)
    }

    @test
    async testIfMissingEntriesCanBeInserted () {
      const newVal1 = {id: 123456, str: '123456', ival: 123456, fval: 123.456, iarr: [1, 2, 3, 4, 5, 6]}
      const newVal2 = {id: 234567, str: '234567', ival: 234567, fval: 234.567, iarr: [2, 3, 4, 5, 6, 7]}

      const values = new Map()
      values.set('123', newVal1)
      values.set('234', newVal2)
      values.set('123456', newVal1)
      values.set('234567', newVal2)

      const ep = Processors.conditionalPutAll(Filters.not(Filters.present()), values)
      const keys = ['123', '234', '345', '456', '123456', '234567']
      await cache.invokeAll(keys, ep)

      await TestUtil.validate(cache, keys, [val123, val234, val345, val456, newVal1, newVal2])
    }
  }

  // ConditionalRemoveProcessor
  @suite(timeout(3000))
  class ConditionalRemoveProcessorTestsSuite
    extends ExtractorProcessorTestsSuiteBase {
    @test
    testTypeNameOf () {
      const ep = Processors.conditionalRemove(Filters.always())
      assert.equal(ep['@class'], internal.processorName('ConditionalRemove'))
    }

    @test
    async testRemovalOfOneExistingKey () {
      assert.equal(await cache.size(), 4)
      assert.deepEqual(await cache.get('123'), val123)

      const ep = Processors.conditionalRemove(Filters.present())
      const removedValue = await cache.invoke('123', ep)
      assert.equal(removedValue, null)

      assert.equal(await cache.size(), 3)
      assert.equal(await cache.get('123'), null)
    }

    @test
    async testRemovalWithNeverFilter () {
      assert.equal(await cache.size(), 4)
      assert.deepEqual(await cache.get('123'), val123)

      const ep = Processors.conditionalRemove(Filters.never()).returnCurrent()
      const removedValue = await cache.invoke('123', ep)
      assert.deepEqual(removedValue, val123)

      assert.equal(await cache.size(), 4)
      assert.deepEqual(await cache.get('123'), val123)
    }
  }

  // VersionedPutProcessor
  @suite(timeout(3000))
  class VersionedPutProcessorTestsSuite
    extends ExtractorProcessorTestsSuiteBase {
    @test
    testTypeNameOf () {
      const ep = Processors.versionedPut(versioned123)
      assert.equal(ep['@class'], internal.processorName('VersionedPut'))
    }

    @test
    async testForExistingEntry () {
      const ep = Processors.versionedPut(versioned123)
      await versioned.invoke('123', ep)

      const expected = {'@version': 2, id: 123, str: '123', ival: 123, fval: 12.3, iarr: [1, 2, 3]}
      assert.deepEqual(await versioned.get('123'), expected)
    }

    @test
    async testForNonExistentMatch () {
      const ep = Processors.versionedPut(versioned123)
      await versioned.invoke('456', ep)

      assert.deepEqual(await versioned.get('456'), versioned456)
    }

    @test
    async testForMultipleUpdates () {
      const ep = Processors.versionedPut(versioned123)
      await versioned.invoke('456', ep)

      assert.deepEqual(await versioned.get('456'), versioned456)
    }
  }

  // VersionedPutAllProcessor
  @suite(timeout(3000))
  class VersionedPutAllProcessorTestsSuite
    extends ExtractorProcessorTestsSuiteBase {
    @test
    testTypeNameOf () {
      const ep = Processors.versionedPutAll(new Map())

      assert.equal(ep['@class'], internal.processorName('VersionedPutAll'))
      assert.equal(ep.insert, false)
      assert.equal(ep.return, false)
    }

    @test
    async testForExistingEntry () {
      const entries = new Map()
      entries.set('123', versioned123)
      entries.set('456', versioned456)
      const ep = Processors.versionedPutAll(entries, true)

      await versioned.invokeAll(['123', '456'], ep)

      const expected123 = {'@version': 2, id: 123, str: '123', ival: 123, fval: 12.3, iarr: [1, 2, 3]}
      const expected456 = {
        '@version': 5,
        id: 456,
        str: '456',
        ival: 456,
        fval: 45.6,
        iarr: [4, 5, 6],
        nullIfOdd: 'non-null'
      }

      await TestUtil.validate(versioned, ['123', '234', '345', '456'],
        [expected123, versioned234, versioned345, expected456])
    }
  }

  // UpdaterProcessor
  @suite(timeout(3000))
  class UpdaterProcessorTestsSuite
    extends ExtractorProcessorTestsSuiteBase {
    @test
    testTypeNameOf () {
      const ep = Processors.update('a.b.ival', 12300)
      assert.equal(ep['@class'], internal.processorName('UpdaterProcessor'))
    }

    @test
    async testUpdateForAgainstSingleKey () {
      const ep1 = Processors.update('str', '123000')
        .andThen(Processors.update('ival', 123000))

      await cache.invoke('123', ep1)

      const processor = Processors.extract('ival').andThen(Processors.extract('str'))
      const value = await cache.invoke('123', processor)

      assert.equal(value.length, 2)
      assert.deepEqual(value, [123000, '123000'])
    }

    @test
    async testUpdateForAgainstMultipleKeys () {
      const ep1 = Processors.update('str', '123000')
        .andThen(Processors.update('ival', 123000))

      const keys = new Set(['123', '234', '345'])
      const val = new Set([[123000, '123000'], [123000, '123000'], [123000, '123000']])
      await cache.invokeAll(keys, ep1)

      const processor = Processors.extract('ival').andThen(Processors.extract('str'))
      const value = await cache.invokeAll(keys, processor)

      assert.deepEqual(new Set(value.keys()), keys)
      assert.deepEqual(new Set(value.values()), val)
    }

    @test
    async testUpdateWithFilter () {
      const ep1 = Processors.update('str', '123000')
        .andThen(Processors.update('ival', 123000))

      const keys = new Set(['123', '234', '345', '456'])
      const expectedValues = new Set([[123, '123'], [123000, '123000'], [123000, '123000'], [456, '456']])
      await cache.invokeAll(Filters.arrayContainsAll(Extractors.extract('iarr'), [3, 4]), ep1)

      const processor = Processors.extract('ival').andThen(Processors.extract('str'))
      const value = await cache.invokeAll(keys, processor)

      assert.deepEqual(new Set(value.keys()), keys)
      assert.deepEqual(new Set(value.values()), expectedValues)
    }
  }

  // UpdaterProcessor
  @suite(timeout(3000))
  class MethodInvocationProcessorTestsSuite
    extends ExtractorProcessorTestsSuiteBase {
    @test
    testTypeNameOf () {
      const ep = Processors.invokeAccessor('ival')
      assert.equal(ep['@class'], internal.processorName('MethodInvocationProcessor'))
    }

    @test
    async testAgainstSingleKey () {
      const ep = Processors.invokeAccessor('get', 'ival')
      const value = await cache.invoke('123', ep)

      assert.equal(value, 123)
    }

    @test
    async testMutatorAgainstSingleKey () {
      const ep = Processors.invokeMutator('remove', 'ival')
        .andThen(Processors.invokeMutator('remove', 'iarr'))

      const status = await cache.invoke('123', ep)
      const value = await cache.get('123')

      // Check removed values
      assert.deepEqual(status, [123, [1, 2, 3]])

      // Ensure that remaining attributes are still intact.
      assert.deepEqual(value, {id: 123, str: '123', fval: 12.3, group: 1})
    }
  }

  // NumberMultiplier
  @suite(timeout(3000))
  class NumberMultiplierTestsSuite
    extends ExtractorProcessorTestsSuiteBase {
    @test
    testTypeNameOf () {
      const ep: any = Processors.multiply('ival', 2)

      assert.equal(ep['@class'], internal.processorName('NumberMultiplier'))
      assert.equal(ep.manipulator['@class'], extint.extractorName('CompositeUpdater'))
      assert.equal(ep.manipulator.extractor['@class'], extint.extractorName('UniversalExtractor'))
      assert.equal(ep.manipulator.updater['@class'], extint.extractorName('UniversalUpdater'))
    }

    @test
    async testAgainstSingleKey () {
      assert.deepEqual(await cache.get('123'), val123)
      const value1 = await cache.invoke('123', Processors.multiply('ival', 2).returnNewValue())
      assert.equal(value1, 246)
      let current = await cache.get('123')
      assert.equal(current.ival, 246)
      const value2 = await cache.invoke('123', Processors.multiply('ival', 0.5).returnNewValue())
      assert.equal(value2, 123)
      current = await cache.get('123')
      assert.equal(current.ival, 123)
    }
  }

  // NumberIncrementor
  @suite(timeout(3000))
  class NumberIncrementorTestsSuite
    extends ExtractorProcessorTestsSuiteBase {
    @test
    testTypeNameOf () {
      const ep: any = Processors.increment('ival', 2)

      assert.equal(ep['@class'], internal.processorName('NumberIncrementor'))
      assert.equal(ep.manipulator['@class'], extint.extractorName('CompositeUpdater'))
      assert.equal(ep.manipulator.extractor['@class'], extint.extractorName('UniversalExtractor'))
      assert.equal(ep.manipulator.updater['@class'], extint.extractorName('UniversalUpdater'))
    }

    @test
    async testAgainstSingleKey () {
      assert.deepEqual(await cache.get('123'), val123)
      const value1 = await cache.invoke('123', Processors.increment('ival', 2).returnNewValue())
      assert.equal(value1, 125)
      let current = await cache.get('123')
      assert.equal(current.ival, 125)
      const value2 = await cache.invoke('123', Processors.increment('ival', -25).returnNewValue())
      assert.equal(value2, 100)
      current = await cache.get('123')
      assert.equal(current.ival, 100)
    }
  }
})
