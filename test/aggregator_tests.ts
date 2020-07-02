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

import { Filters } from '../src/filter/filters'

import { val123, val234, val345, val456 } from './abstract_named_cache_tests'

export const assert = require('assert').strict;
export const session = new SessionBuilder().build()

describe('Aggregators IT Test Suite', () => {
  let cache: NamedCacheClient

  class AggregatorsTestSuiteBase {
    public static async before () {
      cache = session.getCache('client-cache')
      await cache.clear()
      await AggregatorsTestSuiteBase.populateCache(cache)
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
  }

  describe('Average Aggregator Test Suite', () => {
    const agg = Aggregators.average('id')

    @suite(timeout(30000))
    class AverageTestSuite
      extends AggregatorsTestSuiteBase {
      @test
      async shouldAggregateAllEntries () {
        const result = await cache.aggregate(agg)
        assert.equal(Number(result), 289.5)
      }

      @test
      async shouldAggregateFilteredEntries () {
        const filter = Filters.between('id', 123, 456)
        const result = await cache.aggregate(filter, agg)
        assert.equal(Number(result), 289.5)
      }

      @test
      async shouldAggregateEntriesForSpecifiedKeys () {
        const result = await cache.aggregate(['345', '456'], agg)
        assert.equal(Number(result), 400.5)
      }
    }
  })

  describe('Min Aggregator Test Suite', () => {
    const agg = Aggregators.min('str')

    @suite(timeout(30000))
    class MinTestSuite
      extends AggregatorsTestSuiteBase {
      @test
      async shouldAggregateAllEntries () {
        const result = await cache.aggregate(agg)
        assert.equal(result, '123')
      }

      @test
      async shouldAggregateFilteredEntries () {
        const filter = Filters.between('id', 345, 456, true, true)
        const result = await cache.aggregate(filter, agg)
        assert.equal(result, '345')
      }

      @test
      async shouldAggregateEntriesForSpecifiedKeys () {
        const result = await cache.aggregate(['345', '456'], agg)
        assert.equal(result, '345')
      }
    }
  })

  describe('Max Aggregator Test Suite', () => {
    const agg = Aggregators.max('fval')

    @suite(timeout(30000))
    class MaxTestSuite
      extends AggregatorsTestSuiteBase {
      @test
      async shouldAggregateAllEntries () {
        const result = await cache.aggregate(agg)
        assert.equal(result, 45.6)
      }

      @test
      async shouldAggregateFilteredEntries () {
        const filter = Filters.between('id', 123, 456, true, false)
        const result = await cache.aggregate(filter, agg)
        assert.equal(result, 34.5)
      }

      @test
      async shouldAggregateEntriesForSpecifiedKeys () {
        const result = await cache.aggregate(['123', '345'], agg)
        assert.equal(result, 34.5)
      }
    }
  })

  describe('Count Aggregator Test Suite', () => {
    const agg = Aggregators.count()

    @suite(timeout(30000))
    class CountTestSuite
      extends AggregatorsTestSuiteBase {
      @test
      async shouldAggregateAllEntries () {
        const result = await cache.aggregate(agg)
        assert.equal(result, 4)
      }

      @test
      async shouldAggregateFilteredEntries () {
        const filter = Filters.between('id', 123, 456, true, false)
        const result = await cache.aggregate(filter, agg)
        assert.equal(result, 3)
      }

      @test
      async shouldAggregateEntriesForSpecifiedKeys () {
        const result = await cache.aggregate(['123', '345'], agg)
        assert.equal(result, 2)
      }
    }
  })

  describe('Distinct Aggregator Test Suite', () => {
    const agg = Aggregators.distinct('group')

    @suite(timeout(30000))
    class DistinctTestSuite
      extends AggregatorsTestSuiteBase {
      @test
      async shouldAggregateAllEntries () {
        const result = await cache.aggregate(agg)
        console.log(' Distinct result: ' + JSON.stringify(result))
        assert.deepEqual(new Set(result), new Set([1, 2, 3]))
      }

      @test
      async shouldAggregateFilteredEntries () {
        const filter = Filters.between('id', 123, 456, true, false)
        const result = await cache.aggregate(filter, agg)
        assert.deepEqual(new Set(result), new Set([1, 2]))
      }

      @test
      async shouldAggregateEntriesForSpecifiedKeys () {
        const result = await cache.aggregate(['123', '345'], agg)
        assert.deepEqual(new Set(result), new Set([1, 2]))
      }
    }
  })

  describe('GroupBy Aggregator Test Suite', () => {
    const agg = Aggregators.groupBy('group', Aggregators.min('id'), Filters.always())

    @suite(timeout(30000))
    class GroupByTestSuite
      extends AggregatorsTestSuiteBase {
      @test
      async shouldAggregateAllEntries () {
        const result = await cache.aggregate(agg)
        console.log(' GroupBy result: ' + JSON.stringify(result))
        assert.deepEqual(new Set(result), new Set([{key: 2, value: 234}, {key: 1, value: 123}, {
          key: 3,
          value: 456
        }]))
      }

      @test
      async shouldAggregateFilteredEntries () {
        const filter = Filters.between('id', 123, 456, true, false)
        const result = await cache.aggregate(filter, agg)
        assert.deepEqual(new Set(result), new Set([{key: 2, value: 234}, {key: 1, value: 123}]))
      }

      @test
      async shouldAggregateEntriesForSpecifiedKeys () {
        const result = await cache.aggregate(['123', '345'], agg)
        assert.deepEqual(new Set(result), new Set([{key: 1, value: 123}, {key: 2, value: 345}]))
      }
    }
  })

  describe('Sum Aggregator Test Suite', () => {
    const agg = Aggregators.sum('ival')

    @suite(timeout(30000))
    class SumTestSuite
      extends AggregatorsTestSuiteBase {
      @test
      async shouldAggregateAllEntries () {
        const result = await cache.aggregate(agg)
        assert.equal(Number(result), 1158)
      }

      @test
      async shouldAggregateFilteredEntries () {
        const filter = Filters.between('id', 123, 456, true, false)
        const result = await cache.aggregate(filter, agg)
        assert.equal(Number(result), 702)
      }

      @test
      async shouldAggregateEntriesForSpecifiedKeys () {
        const result = await cache.aggregate(['123', '456'], agg)
        assert.equal(Number(result), 579)
      }
    }
  })
})
