/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

const { Filters, Session } = require('../lib')
const t = require('./util')
const assert = require('assert').strict
const { describe, it, after, beforeEach } = require('mocha')

describe('Filter IT Test Suite', function () {
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
    cache.release().finally(() => session.close().catch())
  })

  describe('A Filter', () => {
    it('should be composable with \'and\'', async () => {
      const f1 = Filters.equal('str', '123')
      const f2 = f1.and(Filters.equal('ival', 123))
      const entries = await cache.entries(f2)
      await t.compareEntries([[val123, val123]], entries)
    })

    it('should be composable with \'or\'', async () => {
      const f1 = Filters.equal('str', '123')
      const f2 = f1.or(Filters.equal('ival', 234))

      await t.compareElements([val123, val234], await cache.values(f2))
    })

    it('should be composable with \'xor\'', async () => {
      const f1 = Filters.equal('str', '123')
      const f2 = f1.xor(Filters.equal('ival', 123))
      const entries = await cache.entries(f2)

      assert.equal(await entries.size, 0)
    })
  })

  describe('Filters.all()', () => {
    it('should only return entries that match all applied filters', async () => {
      // fval discriminate matches three entries.  group discriminate narrows to two entries
      const f1 = Filters.all(Filters.greater('fval', 23.1), Filters.equal('group', 2))
      const entries = await cache.entries(f1)

      await t.compareEntries([[val234, val234], [val345, val345]], entries)
    })
  })

  describe('Filters.any()', () => {
    it('should return results that match any of the applied filters', async () => {
      const f1 = Filters.any(Filters.less('ival', 150), Filters.greater('ival', 400))
      const entries = await cache.entries(f1)

      await t.compareEntries([[val123, val123], [val456, val456]], entries)
    })
  })

  describe('Filters.arrayContains()', () => {
    it('should return results based on the value of a single array element', async () => {
      const f1 = Filters.arrayContains('iarr', 3)
      const entries = await cache.entries(f1)

      await t.compareEntries([[val123, val123], [val234, val234], [val345, val345]], entries)
    })
  })

  describe('Filters.arrayContainsAll()', () => {
    it('should return results based on the value of a multiple array elements; entries must contain all elements', async () => {
      // noinspection JSCheckFunctionSignatures
      const f1 = Filters.arrayContainsAll('iarr', new Set([2, 3]))
      const entries = await cache.entries(f1)

      await t.compareEntries([[val123, val123], [val234, val234]], entries)
    })
  })

  describe('Filters.arrayContainsAny()', () => {
    it('should return results based on the value of a multiple array elements; entries must contain any of the elements', async () => {
      // noinspection JSCheckFunctionSignatures
      const f1 = Filters.arrayContainsAny('iarr', new Set([2, 3]))
      const entries = await cache.entries(f1)

      await t.compareEntries([[val123, val123], [val234, val234], [val345, val345]], entries)
    })
  })

  describe('Filters.between()', () => {
    it('should return results including upper and lower boundaries (default)', async () => {
      const f1 = Filters.between('ival', 123, 345)
      const entries = await cache.entries(f1)

      await t.compareEntries([[val123, val123], [val234, val234], [val345, val345]], entries)
    })

    it('should return results excluding upper and lower boundaries (explicit)', async () => {
      const f1 = Filters.between('ival', 123, 345, false, false)
      const entries = await cache.entries(f1)

      await t.compareEntries([[val234, val234]], entries)
    })

    it('should be possible to include results matching lower boundary', async () => {
      const f1 = Filters.between('ival', 123, 345, true)
      const entries = await cache.entries(f1)

      await t.compareEntries([[val123, val123], [val234, val234], [val345, val345]], entries)
    })

    it('should be possible to include results matching upper boundary', async () => {
      const f1 = Filters.between('ival', 123, 345, false, true)
      const entries = await cache.entries(f1)

      await t.compareEntries([[val234, val234], [val345, val345]], entries)
    })

    it('should be possible to include results matching both upper and lower boundaries', async () => {
      const f1 = Filters.between('ival', 123, 345, true, true)
      const entries = await cache.entries(f1)

      await t.compareEntries([[val123, val123], [val234, val234], [val345, val345]], entries)
    })
  })

  describe('Filters.contains()', () => {
    it('should return results based on the value of a single collection element', async () => {
      const f1 = Filters.contains('iarr', 3)
      const entries = await cache.entries(f1)

      await t.compareEntries([[val123, val123], [val234, val234], [val345, val345]], entries)
    })
  })

  describe('Filters.containsAll()', () => {
    it('should return results based on the value of a multiple collection elements; entries must contain all elements', async () => {
      // noinspection JSCheckFunctionSignatures
      const f1 = Filters.containsAll('iarr', new Set([2, 3]))
      const entries = await cache.entries(f1)

      await t.compareEntries([[val123, val123], [val234, val234]], entries)
    })
  })

  describe('Filters.containsAny()', () => {
    it('should return results based on the value of a multiple collection elements; entries must contain any of the elements', async () => {
      // noinspection JSCheckFunctionSignatures
      const f1 = Filters.containsAny('iarr', new Set([2, 3]))
      const entries = await cache.entries(f1)

      await t.compareEntries([[val123, val123], [val234, val234], [val345, val345]], entries)
    })
  })

  describe('Filters.equal()', () => {
    it('should return results based on field equality', async () => {
      const f1 = Filters.equal('ival', 345)
      const entries = await cache.entries(f1)

      await t.compareEntries([[val345, val345]], entries)
    })
  })

  describe('Filters.greater()', () => {
    it('should return results only if the provided field is greater than the provided value (excluding boundary)', async () => {
      const f1 = Filters.greater('ival', 345)
      const entries = await cache.entries(f1)

      await t.compareEntries([[val456, val456]], entries)
    })
  })

  describe('Filters.greaterEqual()', () => {
    it('should return results only if the provided field is greater than the provided value (including boundary)', async () => {
      const f1 = Filters.greaterEqual('ival', 345)
      const entries = await cache.entries(f1)

      await t.compareEntries([[val345, val345], [val456, val456]], entries)
    })
  })

  describe('Filters.in()', () => {
    it('should return results for those entries that have matching field values', async () => {
      // noinspection JSCheckFunctionSignatures
      const f1 = Filters.in('ival', new Set([234, 345]))
      const entries = await cache.entries(f1)

      await t.compareEntries([[val234, val234], [val345, val345]], entries)
    })
  })

  describe('Filters.not()', () => {
    it('should return entries that resolve to the logical \'not\' of the provided filter', async () => {
      const f1 = Filters.not(Filters.equal('ival', 234))
      const entries = await cache.entries(f1)
      await t.compareEntries([[val123, val123], [val345, val345], [val456, val456]], entries)
    })
  })

  describe('Filters.isNull()', () => {
    it('should return entries whose extracted value is \'null\'', async () => {
      const f1 = Filters.isNull('nullIfOdd')
      const entries = await cache.entries(f1)
      await t.compareEntries([[val123, val123], [val345, val345]], entries)
    })
  })

  describe('Filters.isNotNull()', () => {
    it('should return entries whose extracted value is not \'null\'', async () => {
      const f1 = Filters.isNotNull('nullIfOdd')
      const entries = await cache.entries(f1)
      await t.compareEntries([[val234, val234], [val456, val456]], entries)
    })
  })
})
