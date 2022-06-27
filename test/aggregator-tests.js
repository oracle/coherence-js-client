/*
 * Copyright (c) 2020, 2022 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

const { Aggregators, Filters, Session, aggregator } = require('../lib')
const test = require('./util')
const assert = require('assert').strict
const { describe, it, after, beforeEach } = require('mocha')

describe('Aggregators IT Test Suite', function () {
  const val123 = { id: 123, str: '123', ival: 123, fval: 12.3, iarr: [1, 2, 3], group: 1 }
  const val234 = { id: 234, str: '234', ival: 234, fval: 23.4, iarr: [2, 3, 4], group: 2, nullIfOdd: 'non-null' }
  const val345 = { id: 345, str: '345', ival: 345, fval: 34.5, iarr: [3, 4, 5], group: 2 }
  const val456 = { id: 456, str: '456', ival: 456, fval: 45.6, iarr: [4, 5, 6], group: 3, nullIfOdd: 'non-null' }

  const session = new Session()
  const cache = session.getCache('cache-client')
  this.timeout(30000)

  beforeEach(async () => {
    await cache.clear()
    await cache.set(val123, val123)
    await cache.set(val234, val234)
    await cache.set(val345, val345)
    await cache.set(val456, val456)

    assert.equal(await cache.empty, false)
    assert.equal(await cache.size, 4)
  })

  after(() => {
    cache.release().finally(() => session.close())
  })

  describe('Average Aggregator', async () => {
    const agg = Aggregators.average('id')

    it('should aggregate all entries', async () => {
      const result = await cache.aggregate(agg)
      assert.equal(Number(result), 289.5)
    })

    it('should aggregate filtered entries', async () => {
      const filter = Filters.between('id', 123, 456)
      const result = await cache.aggregate(filter, agg)
      assert.equal(Number(result), 289.5)
    })

    it('should aggregate entries based on keys', async () => {
      const result = await cache.aggregate([val345, val456], agg)
      assert.equal(Number(result), 400.5)
    })
  })

  describe('Min Aggregator', () => {
    const agg = Aggregators.min('str')

    it('should aggregate all entries', async () => {
      const result = await cache.aggregate(agg)
      assert.equal(result, 123)
    })

    it('should aggregate filtered entries', async () => {
      const filter = Filters.between('id', 345, 456, true, true)
      const result = await cache.aggregate(filter, agg)
      assert.equal(result, 345)
    })

    it('should aggregate entries based on keys', async () => {
      const result = await cache.aggregate([val345, val456], agg)
      assert.equal(result, 345)
    })
  })

  describe('Max Aggregator', () => {
    const agg = Aggregators.max('fval')

    it('should aggregate all entries', async () => {
      const result = await cache.aggregate(agg)
      assert.equal(result, 45.6)
    })

    it('should aggregate filtered entries', async () => {
      const filter = Filters.between('id', 123, 456, true, false)
      const result = await cache.aggregate(filter, agg)
      assert.equal(result, 34.5)
    })

    it('should aggregate entries based on keys', async () => {
      const result = await cache.aggregate([val123, val345], agg)
      assert.equal(result, 34.5)
    })
  })

  describe('Count Aggregator', function () {
    const agg = Aggregators.count()

    it('should aggregate all entries', async () => {
      const result = await cache.aggregate(agg)
      assert.equal(result, 4)
    })

    it('should aggregate filtered entries', async () => {
      const filter = Filters.between('id', 123, 456, true, false)
      const result = await cache.aggregate(filter, agg)
      assert.equal(result, 3)

    })

    it('should aggregate entries based on keys', async () => {
      const result = await cache.aggregate([val123, val345], agg)
      assert.equal(result, 2)
    })
  })

  describe('Distinct Aggregator', () => {
    const agg = Aggregators.distinct('group')

    it('should aggregate all entries', async () => {
      const result = await cache.aggregate(agg)
      await test.compareElements([1, 2, 3], result)
    })

    it('should aggregate filtered entries', async () => {
      const filter = Filters.between('id', 123, 456, true, false)
      const result = await cache.aggregate(filter, agg)
      await test.compareElements([1, 2], result)
    })

    it('should aggregate entries based on keys', async () => {
      const result = await cache.aggregate([val123, val345], agg)
      await test.compareElements([1, 2], result)
    })
  })

  describe('GroupBy Aggregator', () => {
    const agg = Aggregators.groupBy('group', Aggregators.min('id'), Filters.always())

    it('should aggregate all entries', async () => {
      const result = await cache.aggregate(agg)
      await test.compareElements([{ key: 2, value: 234 }, { key: 1, value: 123 }, { key: 3, value: 456 }],
        result)
    })

    it('should aggregate filtered entries', async () => {
      const filter = Filters.between('id', 123, 456, true, false)
      const result = await cache.aggregate(filter, agg)
      await test.compareElements([{ key: 2, value: 234 }, { key: 1, value: 123 }], result)
    })

    it('should aggregate entries based on keys', async () => {
      const result = await cache.aggregate([val123, val345], agg)
      await test.compareElements([{ key: 1, value: 123 }, { key: 2, value: 345 }], result)
    })
  })

  describe('Sum Aggregator', () => {
    const agg = Aggregators.sum('ival')

    it('should aggregate all entries', async () => {
      const result = await cache.aggregate(agg)
      assert.equal(result, 1158)
    })

    it('should aggregate filtered entries', async () => {
      const filter = Filters.between('id', 123, 456, true, false)
      const result = await cache.aggregate(filter, agg)
      assert.equal(result, 702)
    })

    it('should aggregate entries based on keys', async () => {
      const result = await cache.aggregate([val123, val456], agg)
      assert.equal(result, 579)
    })
  })

  describe('Priority Aggregator', () => {
    const agg = Aggregators.priority(Aggregators.sum('ival'))

    it('should have the expected structure', () => {
      assert.equal(agg['@class'], 'aggregator.PriorityAggregator')
      assert.equal(agg.requestTimeoutInMillis, aggregator.Timeout.DEFAULT)
      assert.equal(agg.executionTimeoutInMillis, aggregator.Timeout.DEFAULT)
      assert.equal(agg.schedulingPriority, aggregator.Schedule.STANDARD)
      assert.deepEqual(agg['aggregator'], Aggregators.sum('ival'))

      const agg2 = Aggregators.priority(Aggregators.sum('ival'), aggregator.Schedule.IMMEDIATE,
        aggregator.Timeout.NONE, aggregator.Timeout.NONE)

      assert.equal(agg2['@class'], 'aggregator.PriorityAggregator')
      assert.equal(agg2.requestTimeoutInMillis, aggregator.Timeout.NONE)
      assert.equal(agg2.executionTimeoutInMillis, aggregator.Timeout.NONE)
      assert.equal(agg2.schedulingPriority, aggregator.Schedule.IMMEDIATE)
      assert.deepEqual(agg2['aggregator'], Aggregators.sum('ival'))
    })

    it('should aggregate all entries', async () => {
      const result = await cache.aggregate(agg)
      assert.equal(result, 1158)
    })

    it('should aggregate filtered entries', async () => {
      const filter = Filters.between('id', 123, 456, true, false)
      const result = await cache.aggregate(filter, agg)
      assert.equal(result, 702)
    })

    it('should aggregate entries based on keys', async () => {
      const result = await cache.aggregate([val123, val456], agg)
      assert.equal(result, 579)
    })
  })

  describe('Query Recorder', () => {
    const agg = Aggregators.record()

    it('should have the expected structure', () => {
      assert.equal(agg['@class'], 'aggregator.QueryRecorder')
      assert.deepEqual(agg['type'], { enum: 'EXPLAIN' })

      const agg2 = Aggregators.record(aggregator.RecordType.TRACE)
      assert.equal(agg2['@class'], 'aggregator.QueryRecorder')
      assert.deepEqual(agg2['type'], { enum: 'TRACE' })
    })

    it('[EXPLAIN] should aggregate filtered entries', async () => {
      const filter = Filters.between('id', 123, 456, true, false)
      const result = await cache.aggregate(filter, agg)
      assert.notEqual(result.results, undefined)
      assert.equal(result.results.length, 1)
      assert.notEqual(result.results[0]['partitionSet'], undefined)
      assert.notEqual(result.results[0]['steps'], undefined)
    })

    it('[TRACE] should aggregate filtered entries', async () => {
      const filter = Filters.between('id', 123, 456, true, false)
      const result = await cache.aggregate(filter, Aggregators.record(aggregator.RecordType.TRACE))
      assert.notEqual(result.results, undefined)
      assert.equal(result.results.length, 1)
      assert.notEqual(result.results[0]['partitionSet'], undefined)
      assert.notEqual(result.results[0]['steps'], undefined)
    })
  })

  describe('Top Aggregator', function () {

    describe('in ascending mode', function () {

      const aggregator = Aggregators.top(3).orderBy('ival').ascending()

      it('should have the expected structure', function () {

        assert.equal(aggregator['@class'], 'aggregator.TopNAggregator')
        assert.equal(aggregator['comparator']['comparator']['extractor']['name'], 'ival')
        assert.equal(aggregator['results'], 3)
        assert.equal(aggregator['inverse'], true)
      })

      it('should aggregate entries based on keys', function (done) {
        cache.aggregate([val123, val234, val345], aggregator)
          .then(function (data) {
            assert.deepEqual([val123, val234, val345], data)
            done()
          })
          .catch(e => done(e))
      })

      it('should aggregate filtered entries', function (done) {
        cache.aggregate(Filters.between('id', 123, 456, true, false), aggregator)
          .then(function (data) {
            assert.deepEqual([val123, val234, val345], data)
            done()
          })
          .catch(e => done(e))
      })
    })

    describe('in descending mode', function () {

      const aggregator = Aggregators.top(3).orderBy('ival').descending()

      it('should have the expected structure', function () {
        assert.equal(aggregator['@class'], 'aggregator.TopNAggregator')
        assert.equal(aggregator['comparator']['comparator']['extractor']['name'], 'ival')
        assert.equal(aggregator['results'], 3)
        assert.equal(aggregator['inverse'], false)
      })

      it('should aggregate entries based on keys', function (done) {
        cache.aggregate([val123, val234, val345], aggregator)
          .then(function (data) {
            assert.deepEqual([val345, val234, val123], data)
            done()
          })
          .catch(e => done(e))
      })

      it('should aggregate filtered entries', function (done) {
        cache.aggregate(Filters.between('id', 123, 456, true, false), aggregator)
          .then(function (data) {
            assert.deepEqual([val345, val234, val123], data)
            done()
          })
          .catch(e => done(e))
      })
    })
  })

  describe('Reducer Aggregator', function () {

    const aggregator = Aggregators.reduce('ival')

    it('should have the expected structure', function () {
      assert.equal(aggregator['@class'], 'aggregator.ReducerAggregator')
      assert.equal(aggregator['extractor']['name'], 'ival')
    })

    it('should aggregate entries based on keys', function (done) {
      cache.aggregate([val123, val234, val345], aggregator)
        .then(function (data) {
          test.compareEntries([[val123, 123], [val234, 234], [val345, 345]], data)
          done()
        })
        .catch(e => done(e))
    })

    it('should aggregate filtered entries', function (done) {
      cache.aggregate(Filters.between('id', 123, 456, true, false), aggregator)
        .then(function (data) {
          test.compareEntries([[val123, 123], [val234, 234], [val345, 345]], data)
          done()
        })
        .catch(e => done(e))
    })
  })

  describe('Script Aggregator', function () {

    const aggregator = Aggregators.script('js', 'someFilter', ['a', 123])

    it('can be constructed', function () {
      assert.equal(aggregator['@class'], 'aggregator.ScriptAggregator')
      assert.equal(aggregator['language'], 'js')
      assert.equal(aggregator['name'], 'someFilter')
      assert.deepEqual(aggregator['args'], ['a', 123])
    })
  })

  describe('An aggregator', function () {
    it('should be able to be run in a sequence by using andThen', async () => {
      const aggregator = Aggregators.max('ival').andThen(Aggregators.min('ival'))
      const result = await cache.aggregate(aggregator)
      assert.deepEqual(result, [456, 123])
    })
  })
})
