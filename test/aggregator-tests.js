/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

const { Aggregators, Filters, SessionBuilder } = require('@oracle/coherence')
const test = require('./util')
const assert = require('assert').strict

describe('Aggregators IT Test Suite', function () {
  const val123 = { id: 123, str: '123', ival: 123, fval: 12.3, iarr: [1, 2, 3], group: 1 }
  const val234 = { id: 234, str: '234', ival: 234, fval: 23.4, iarr: [2, 3, 4], group: 2, nullIfOdd: 'non-null' }
  const val345 = { id: 345, str: '345', ival: 345, fval: 34.5, iarr: [3, 4, 5], group: 2 }
  const val456 = { id: 456, str: '456', ival: 456, fval: 45.6, iarr: [4, 5, 6], group: 3, nullIfOdd: 'non-null' }

  const session = new SessionBuilder().build()
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
      assert.equal(result, '123')
    })

    it('should aggregate filtered entries', async () => {
      const filter = Filters.between('id', 345, 456, true, true)
      const result = await cache.aggregate(filter, agg)
      assert.equal(result, '345')
    })

    it('should aggregate entries based on keys', async () => {
      const result = await cache.aggregate([val345, val456], agg)
      assert.equal(result, '345')
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
      assert.equal(Number(result), 1158)
    })

    it('should aggregate filtered entries', async () => {
      const filter = Filters.between('id', 123, 456, true, false)
      const result = await cache.aggregate(filter, agg)
      assert.equal(Number(result), 702)
    })

    it('should aggregate entries based on keys', async () => {
      const result = await cache.aggregate([val123, val456], agg)
      assert.equal(Number(result), 579)
    })
  })
})
