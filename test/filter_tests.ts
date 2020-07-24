/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { suite, test, timeout } from '@testdeck/mocha'
import { Extractors, Filters, NamedCacheClient, SessionBuilder } from '../src'
import { TestUtil, val123, val234, val345, val456 } from './abstract_named_cache_tests'

export const assert = require('assert').strict
export const session = new SessionBuilder().build()

describe('Filter IT Test Suite', () => {
  let cache: NamedCacheClient

  @suite(timeout(3000))
  class FilterTestsSuite {
    public static async before () {
      cache = session.getCache('filter-cache')
      await cache.clear()
      await TestUtil.populateCache(cache)
    }

    public static after () {
      cache.release()
    }

    @test
    async composeFilterWithAnd () {
      const f1 = Filters.equal('str', '123')
      const f2 = f1.and(Filters.equal('ival', 123))
      const entries = await cache.entrySet(f2)

      const values = TestUtil.entriesToValues(entries)
      assert.equal(values.size, 1)
      assert.deepEqual(Array.from(values)[0], val123)
    }

    @test
    async composeFilterWithOr () {
      const f1 = Filters.equal('str', '123')
      const f2 = f1.or(Filters.equal('ival', 234))

      const values = Array.from(await cache.values(f2))
      assert.equal(values.length, 2)
      assert.deepEqual(values, [val123, val234])
    }

    @test
    async composeFilterWithXor () {
      const f1 = Filters.equal('str', '123')
      const f2 = f1.xor(Filters.equal('ival', 123))
      const entries = await cache.entrySet(f2)

      assert.equal(entries.size, 0)
    }

    @test
    async testEntrySetWithAllFilterWithNoResult () {
      const f1 = Filters.all(Filters.always(), Filters.never())
      const entries = await cache.entrySet(f1)

      assert.equal(entries.size, 0)
    }

    // AllFilter
    @test
    async testAllFilterWithKeySet () {
      const f1 = Filters.all(Filters.equal('str', '123'), Filters.equal('ival', 234))
      assert.equal(Array.from(await cache.keySet(f1)).length, 0)
    }

    @test
    async testAllFilterWithEntrySet () {
      const f1 = Filters.all(Filters.equal('str', '123'), Filters.equal('ival', 234))
      assert.equal(Array.from(await cache.entrySet(f1)).length, 0)
    }

    @test
    async testAllFilterWithValues () {
      const f1 = Filters.all(Filters.equal('str', '123'), Filters.equal('ival', 234))
      assert.equal(Array.from(await cache.values(f1)).length, 0)
    }

    // AnyFilter
    @test
    async testAnyFilterWithKeySet () {
      const f1 = Filters.any(Filters.equal('str', '123'), Filters.equal('ival', 456))
      const keys = await cache.keySet(f1)

      assert.equal(keys.size, 2)
      assert.deepEqual(Array.from(keys), ['123', '456'])
    }

    @test
    async testAnyFilterWithEntrySet () {
      const f1 = Filters.any(Filters.equal('str', '123'), Filters.equal('ival', 456))
      const entries = await cache.entrySet(f1)

      assert.deepEqual(TestUtil.entriesToKeys(entries), new Set(['123', '456']))
      assert.deepEqual(TestUtil.entriesToValues(entries), new Set([val123, val456]))
    }

    @test
    async testAnyFilterWithValues () {
      const f1 = Filters.any(Filters.equal('str', '123'), Filters.equal('ival', 456))
      const values = await cache.values(f1)

      assert.deepEqual(Array.from(values), [val123, val456])
    }

    // ArrayContains
    @test
    async testArrayContainsWithKeySet () {
      const f1 = Filters.arrayContains(Extractors.extract('iarr'), 3)
      const keys = await cache.keySet(f1)

      assert.equal(keys.size, 3)
      assert.deepEqual(keys, new Set(['123', '234', '345']))
    }

    @test
    async testArrayContainsWithEntrySet () {
      const f1 = Filters.arrayContains(Extractors.extract('iarr'), 3)
      const entries = await cache.entrySet(f1)

      assert.equal(entries.size, 3)
      assert.deepEqual(TestUtil.entriesToKeys(entries), new Set(['123', '234', '345']))
      assert.deepEqual(TestUtil.entriesToValues(entries), new Set([val123, val234, val345]))
    }

    @test
    async testArrayContainsWithValues () {
      const f1 = Filters.arrayContains(Extractors.extract('iarr'), 3)
      const entries = await cache.values(f1)

      assert.equal(entries.size, 3)
      assert.deepEqual(entries, new Set([val123, val234, val345]))
    }

    // ArrayContainsAll
    @test
    async testArrayContainsAllWithKeySet () {
      const f1 = Filters.arrayContainsAll(Extractors.extract('iarr'), [1, 2])
      const keys = await cache.keySet(f1)

      assert.equal(keys.size, 1)
      assert.equal(Array.from(keys)[0], '123')
    }

    @test
    async testArrayContainsAllWithEntrySet () {
      const f1 = Filters.arrayContainsAll(Extractors.extract('iarr'), [1, 2])
      const entries = await cache.entrySet(f1)

      assert.equal(entries.size, 1)
      assert.deepEqual(TestUtil.entriesToKeys(entries), new Set(['123']))
      assert.deepEqual(TestUtil.entriesToValues(entries), new Set([val123]))
    }

    @test
    async testArrayContainsAllWithValues () {
      const f1 = Filters.arrayContainsAll(Extractors.extract('iarr'), [1, 2])
      const values = await cache.values(f1)

      assert.equal(values.size, 1)
      assert.deepEqual(Array.from(values)[0], val123)
    }

    // ArrayContainsAny
    @test
    async testArrayContainsAnyWithKeySet () {
      const f1 = Filters.arrayContainsAny(Extractors.extract('iarr'), [1, 2])
      const keys = await cache.keySet(f1)

      assert.equal(keys.size, 2)
      assert.deepEqual(keys, new Set(['123', '234']))
    }

    @test
    async testArrayContainsAnyWithEntrySet () {
      const f1 = Filters.arrayContainsAny(Extractors.extract('iarr'), [1, 2])
      const entries = await cache.entrySet(f1)

      assert.equal(entries.size, 2)
      assert.deepEqual(TestUtil.entriesToKeys(entries), new Set(['123', '234']))
      assert.deepEqual(TestUtil.entriesToValues(entries), new Set([val123, val234]))
    }

    @test
    async testArrayContainsAnyWithValues () {
      const f1 = Filters.arrayContainsAny(Extractors.extract('iarr'), [1, 2])
      const values = await cache.values(f1)

      assert.equal(values.size, 2)
      assert.deepEqual(values, new Set([val123, val234]))
    }

    // BetweenFilter
    @test
    async testBetweenWithKeySet () {
      const f1 = Filters.between(Extractors.extract('ival'), 123, 345)
      const entries = await cache.keySet(f1)

      assert.equal(entries.size, 1)
      assert.equal(Array.from(entries)[0], '234')
    }

    @test
    async testBetweenWithEntrySet () {
      const f1 = Filters.between(Extractors.extract('ival'), 123, 345)
      const entries = await cache.entrySet(f1)

      assert.equal(entries.size, 1)
      assert.equal(Array.from(entries)[0].getKey(), '234')
      assert.deepEqual(Array.from(entries)[0].getValue(), val234)
    }

    @test
    async testBetweenWithValues () {
      const f1 = Filters.between(Extractors.extract('ival'), 123, 345)
      const entries = await cache.values(f1)

      assert.equal(entries.size, 1)
      assert.deepEqual(Array.from(entries)[0], val234)
    }

    // BetweenFilter with lower bound
    @test
    async testBetweenFilterWithLowerBoundWithKeySet () {
      const f2 = Filters.between(Extractors.extract('ival'), 123, 345, true)
      const keys = await cache.keySet(f2)

      assert.equal(keys.size, 2)
      assert.deepEqual(keys, new Set(['123', '234']))
    }

    @test
    async testBetweenFilterWithLowerBoundWithEntrySet () {
      const f2 = Filters.between(Extractors.extract('ival'), 123, 345, true)
      const entries = await cache.entrySet(f2)

      assert.equal(entries.size, 2)
      assert.deepEqual(TestUtil.entriesToKeys(entries), new Set(['123', '234']))
      assert.deepEqual(TestUtil.entriesToValues(entries), new Set([val123, val234]))
    }

    @test
    async testBetweenFilterWithLowerBoundWithValues () {
      const f2 = Filters.between(Extractors.extract('ival'), 123, 345, true)
      const values = await cache.values(f2)

      assert.equal(values.size, 2)
      assert.deepEqual(values, new Set([val123, val234]))
    }

    // BetweenFilter with lower and upper bound
    @test
    async testBetweenFilterWithLowerBoundAndUpperBoundWithKeySet () {
      const f2 = Filters.between(Extractors.extract('ival'), 123, 345, true, true)
      const keys = await cache.keySet(f2)

      assert.equal(keys.size, 3)
      assert.deepEqual(keys, new Set(['123', '234', '345']))
    }

    @test
    async testBetweenFilterWithLowerBoundAndUpperBoundWithEntrySet () {
      const f2 = Filters.between(Extractors.extract('ival'), 123, 345, true, true)
      const entries = await cache.entrySet(f2)

      assert.equal(entries.size, 3)
      assert.deepEqual(TestUtil.entriesToKeys(entries), new Set(['123', '234', '345']))
      assert.deepEqual(TestUtil.entriesToValues(entries), new Set([val123, val234, val345]))
    }

    @test
    async testBetweenFilterWithLowerBoundAndUpperBoundWithValues () {
      const f2 = Filters.between(Extractors.extract('ival'), 123, 345, true, true)
      const values = await cache.values(f2)

      assert.equal(values.size, 3)
      assert.deepEqual(values, new Set([val123, val234, val345]))
    }

    // ContainsFilter
    @test
    async testContainsWithKeySet () {
      const f1 = Filters.contains(Extractors.extract('iarr'), 3)
      const keys = await cache.keySet(f1)

      assert.equal(keys.size, 3)
      assert.deepEqual(keys, new Set(['123', '234', '345']))
    }

    @test
    async testContainsWithEntrySet () {
      const f2 = Filters.contains(Extractors.extract('iarr'), 3)
      const entries = await cache.entrySet(f2)

      assert.equal(entries.size, 3)
      assert.deepEqual(TestUtil.entriesToKeys(entries), new Set(['123', '234', '345']))
      assert.deepEqual(TestUtil.entriesToValues(entries), new Set([val123, val234, val345]))
    }

    @test
    async testContainsWithValues () {
      const f2 = Filters.contains(Extractors.extract('iarr'), 3)
      const values = await cache.values(f2)

      assert.equal(values.size, 3)
      assert.deepEqual(values, new Set([val123, val234, val345]))
    }

    // ContainsAllFilter
    @test
    async testContainsAllWithKeySet () {
      const f2 = Filters.containsAll(Extractors.extract('iarr'), [3, 4])
      const keys = await cache.keySet(f2)

      assert.equal(keys.size, 2)
      assert.deepEqual(keys, new Set(['234', '345']))
    }

    @test
    async testContainsAllWithEntrySet () {
      const f2 = Filters.containsAll(Extractors.extract('iarr'), [3, 4])
      const entries = await cache.entrySet(f2)

      assert.equal(entries.size, 2)
      assert.deepEqual(TestUtil.entriesToKeys(entries), new Set(['234', '345']))
      assert.deepEqual(TestUtil.entriesToValues(entries), new Set([val234, val345]))
    }

    @test
    async testContainsAllWithValues () {
      const f2 = Filters.containsAll(Extractors.extract('iarr'), [3, 4])
      const values = await cache.values(f2)

      assert.equal(values.size, 2)
      assert.deepEqual(values, new Set([val234, val345]))
    }

    @test
    async testContainsAllWithEmptyResult () {
      const f2 = Filters.containsAll(Extractors.extract('iarr'), [3, 4, 34])
      const entries2 = await cache.entrySet(f2)

      assert.equal(entries2.size, 0)
    }

    // ContainsAny
    @test
    async testContainsAnyWithKeySet () {
      const f2 = Filters.containsAny(Extractors.extract('iarr'), [3, 4])
      const keys = await cache.keySet(f2)

      assert.equal(keys.size, 4)
      assert.deepEqual(keys, new Set(['123', '234', '345', '456']))
    }

    @test
    async testContainsAnyWithEntrySet () {
      const f2 = Filters.containsAny(Extractors.extract('iarr'), [3, 4])
      const entries = await cache.entrySet(f2)

      assert.equal(entries.size, 4)
      assert.deepEqual(TestUtil.entriesToKeys(entries), new Set(['123', '234', '345', '456']))
      assert.deepEqual(TestUtil.entriesToValues(entries), new Set([val123, val234, val345, val456]))
    }

    @test
    async testContainsAnyWithValues () {
      const f2 = Filters.containsAny(Extractors.extract('iarr'), [3, 4])
      const values = await cache.values(f2)

      assert.equal(values.size, 4)
      assert.deepEqual(values, new Set([val123, val234, val345, val456]))
    }

    @test
    async testContainsAnyWithEmptyResult () {
      const f2 = Filters.containsAny(Extractors.extract('iarr'), [15, 59, 358])
      const entries2 = await cache.entrySet(f2)

      assert.equal(entries2.size, 0)
    }

    @test
    async testContainsAnyWithEmptyCollection () {
      const f2 = Filters.containsAny(Extractors.extract('iarr'), [])
      const entries2 = await cache.entrySet(f2)

      assert.equal(entries2.size, 0)
    }

    // Equal
    @test
    async testEqualsFilterWithKeySet () {
      const f1 = Filters.equal(Extractors.extract('ival'), 234)
        .or(Filters.equal(Extractors.extract('ival'), 345))
      const keys = await cache.keySet(f1)

      assert.equal(keys.size, 2)
      assert.deepEqual(keys, new Set(['234', '345']))
    }

    @test
    async testEqualsFilterWithEntrySet () {
      const f1 = Filters.equal(Extractors.extract('ival'), 234)
        .or(Filters.equal(Extractors.extract('ival'), 345))
      const entries = await cache.entrySet(f1)

      assert.equal(entries.size, 2)
      assert.deepEqual(TestUtil.entriesToKeys(entries), new Set(['234', '345']))
      assert.deepEqual(TestUtil.entriesToValues(entries), new Set([val234, val345]))
    }

    @test
    async testEqualsFilterWithValues () {
      const f1 = Filters.equal(Extractors.extract('ival'), 234)
        .or(Filters.equal(Extractors.extract('ival'), 345))
      const values = await cache.values(f1)

      assert.equal(values.size, 2)
      assert.deepEqual(values, new Set([val234, val345]))
    }

    @test
    async testEqualsFilterWithFieldName () {
      const f1 = Filters.equal('ival', 123).or(Filters.equal('ival', 234))
      const entries = await cache.entrySet(f1)

      assert.equal(entries.size, 2)
      assert.deepEqual(TestUtil.entriesToKeys(entries), new Set(['123', '234']))
      assert.deepEqual(TestUtil.entriesToValues(entries), new Set([val123, val234]))
    }

    // GreaterFilter
    @test
    async testGreaterFilterWithKeySet () {
      const f1 = Filters.greater('ival', 123).and(
        Filters.greater(Extractors.extract('ival'), 234)
      )
      const keys = await cache.keySet(f1)

      assert.equal(keys.size, 2)
      assert.deepEqual(keys, new Set(['345', '456']))
    }

    @test
    async testGreaterFilterWithEntrySet () {
      const f1 = Filters.greater('ival', 123).and(
        Filters.greater(Extractors.extract('ival'), 234)
      )
      const entries = await cache.entrySet(f1)

      assert.equal(entries.size, 2)
      assert.deepEqual(TestUtil.entriesToKeys(entries), new Set(['345', '456']))
      assert.deepEqual(TestUtil.entriesToValues(entries), new Set([val345, val456]))
    }

    @test
    async testGreaterFilterWithValues () {
      const f1 = Filters.greater('ival', 123).and(
        Filters.greater(Extractors.extract('ival'), 234)
      )
      const values = await cache.values(f1)

      assert.equal(values.size, 2)
      assert.deepEqual(values, new Set([val345, val456]))
    }

    @test
    async testGreaterFilterWithFieldName () {
      const f1 = Filters.greater('ival', 123)
      const entries2 = await cache.entrySet(f1)

      assert.equal(entries2.size, 3)
    }

    @test
    async testGreaterFilterWithComposition () {
      const f1 = Filters.greater('ival', 123).or(
        Filters.greater(Extractors.extract('ival'), 345)
      )
      const entries = await cache.entrySet(f1)

      assert.equal(entries.size, 3)
      assert.deepEqual(TestUtil.entriesToKeys(entries), new Set(['234', '345', '456']))
      assert.deepEqual(TestUtil.entriesToValues(entries), new Set([val234, val345, val456]))
    }

    // GreaterEqualsFilter
    @test
    async testGreaterEqualsFilterWithKeySet () {
      const f1 = Filters.greaterEqual('ival', 234).and(
        Filters.greaterEqual(Extractors.extract('ival'), 345)
      )
      const keys = await cache.keySet(f1)

      assert.equal(keys.size, 2)
      assert.deepEqual(keys, new Set(['345', '456']))
    }

    @test
    async testGreaterEqualsFilterWithEntrySet () {
      const f1 = Filters.greaterEqual('ival', 234).and(
        Filters.greaterEqual(Extractors.extract('ival'), 345)
      )
      const entries = await cache.entrySet(f1)

      assert.equal(entries.size, 2)
      assert.deepEqual(TestUtil.entriesToKeys(entries), new Set(['345', '456']))
      assert.deepEqual(TestUtil.entriesToValues(entries), new Set([val345, val456]))
    }

    @test
    async testGreaterEqualsFilterWithValues () {
      const f1 = Filters.greaterEqual('ival', 234).and(
        Filters.greaterEqual(Extractors.extract('ival'), 345)
      )
      const values = await cache.values(f1)

      assert.equal(values.size, 2)
      assert.deepEqual(values, new Set([val345, val456]))
    }

    // In

    @test
    async testInFilterWithKeySet () {
      const f1 = Filters.in(Extractors.extract('ival'), [345, 456])
      const keys = await cache.keySet(f1)

      assert.equal(keys.size, 2)
      assert.deepEqual(keys, new Set(['345', '456']))
    }

    @test
    async testInFilterWithEntrySet () {
      const f1 = Filters.in(Extractors.extract('ival'), [123, 234]).or(Filters.equal('ival', 345))
      const entries = await cache.entrySet(f1)

      assert.equal(entries.size, 3)
      assert.deepEqual(TestUtil.entriesToKeys(entries), new Set(['123', '234', '345']))
      assert.deepEqual(TestUtil.entriesToValues(entries), new Set([val123, val234, val345]))
    }

    @test
    async testInFilterWithValues () {
      const f1 = Filters.in(Extractors.extract('ival'), [123234])
      const values = await cache.values(f1)

      assert.equal(values.size, 0)
    }

    // Not
    @test
    async testNotFilter () {
      const f1 = Filters.not(
        Filters.equal(Extractors.extract('ival'), 234)
      )
      const entries2 = await cache.entrySet(f1)

      assert.equal(entries2.size, 3)
    }

    @test
    async testNotWithFieldName () {
      const f1 = Filters.not(Filters.equal('ival', 123))
      const entries2 = await cache.entrySet(f1)

      assert.equal(entries2.size, 3)
    }

    @test
    async testNotWithComposition () {
      const f1 = Filters.not(Filters.equal('ival', 123).or(
        Filters.equal(Extractors.extract('ival'), 234))
      )
      const entries2 = await cache.entrySet(f1)

      assert.equal(entries2.size, 2)
    }

    // Null
    @test
    async testIsNullFilterWithKeySet () {
      const f1 = Filters.isNull(Extractors.extract('nullIfOdd'))
      const keys = await cache.keySet(f1)

      assert.equal(keys.size, 2)
      assert.deepEqual(keys, new Set(['123', '345']))
    }

    @test
    async testIsNullFilterWithEntrySet () {
      const f1 = Filters.isNull(Extractors.extract('nullIfOdd'))
      const entries = await cache.entrySet(f1)

      assert.equal(entries.size, 2)
      assert.deepEqual(TestUtil.entriesToKeys(entries), new Set(['123', '345']))
      assert.deepEqual(TestUtil.entriesToValues(entries), new Set([val123, val345]))
    }

    @test
    async testIsNullFilterWithValues () {
      const f1 = Filters.isNull(Extractors.extract('nullIfOdd'))
      const values = await cache.values(f1)

      assert.equal(values.size, 2)
      assert.deepEqual(values, new Set([val123, val345]))
    }

    // NotNull
    @test
    async testIsNotNullFilterWithKeySet () {
      const f1 = Filters.isNotNull(Extractors.extract('nullIfOdd'))
      const keys = await cache.keySet(f1)

      assert.equal(keys.size, 2)
      assert.deepEqual(keys, new Set(['234', '456']))
    }

    @test
    async testIsNotNullFilterWithEntrySet () {
      const f1 = Filters.isNotNull(Extractors.extract('nullIfOdd'))
      const entries = await cache.entrySet(f1)

      assert.equal(entries.size, 2)
      assert.deepEqual(TestUtil.entriesToKeys(entries), new Set(['234', '456']))
      assert.deepEqual(TestUtil.entriesToValues(entries), new Set([val234, val456]))
    }

    @test
    async testIsNotNullFilterWithValues () {
      const f1 = Filters.isNotNull(Extractors.extract('nullIfOdd'))
      const values = await cache.values(f1)

      assert.equal(values.size, 2)
      assert.deepEqual(values, new Set([val234, val456]))
    }
  }
})
