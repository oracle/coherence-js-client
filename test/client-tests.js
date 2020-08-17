/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

const { event, Filters, Extractors, SessionBuilder } = require('../lib/index')
const test = require('./util')
const assert = require('assert').strict
const { describe, it, after, beforeEach } = require('mocha')

describe('NamedCacheClient IT Test Suite', function () {
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

  after(async () => {
    await cache.release().finally(() => session.close().catch())
  })

  describe('The cache lifecycle', () => {
    const CACHE_NAME = 'lifecycle-cache'

    it('should generate \'released\' event when the cache is released', async () => {
      const cache = session.getCache(CACHE_NAME)

      const prom = new Promise((resolve) => {
        cache.on(event.CacheLifecycleEvent.RELEASED, cacheName => {
          if (cacheName === CACHE_NAME) {
            resolve()
          }
        })

        setTimeout(() => {
          cache.release()
        }, 100)
      })

      await prom
    })

    it('should generate \'destroyed\' event when the cache is destroyed', async () => {
      const cache = session.getCache(CACHE_NAME)

      const prom = new Promise((resolve) => {
        cache.on(event.CacheLifecycleEvent.DESTROYED, cacheName => {
          if (cacheName === CACHE_NAME) {
            resolve()
          }
        })

        setTimeout(() => {
          cache.destroy()
        }, 100)
      })

      await prom
    })
  })

  describe('Cache function', () => {

    describe('clear()', () => {
      it('should result in an empty cache', async () => {
        await cache.clear()
        assert.equal(await cache.empty, true)
        assert.equal(await cache.size, 0)
      })
    })

    describe('hasEntry', () => {
      it('should return true for an existing entry', async () => {
        assert.equal(await cache.hasEntry(val123, val123), true)
      })

      it('should return false for a non-existing entry', async () => {
        assert.equal(await cache.hasEntry(val345, { id: 123, str: '123' }), false)
      })

      it('should return false after clear using previously existing value', async () => {
        await cache.clear()
        assert.equal(await cache.hasEntry(val123, val123), false)
      })
    })

    describe('has()', () => {
      it('should return true for an existing entry', async () => {
        assert.equal(await cache.has(val123), true)
      })

      it('should return false for a non-existing entry', async () => {
        assert.equal(await cache.has('val345'), false)
      })

      it('should return false after clear using previously existing value', async () => {
        await cache.clear()
        assert.equal(await cache.has(val123), false)
      })
    })

    describe('hasValue()', () => {
      it('should return true for an existing entry', async () => {
        assert.equal(await cache.hasValue(val123), true)
      })

      it('should return false for a non-existing entry', async () => {
        assert.equal(await cache.hasValue('val345'), false)
      })

      it('should return false after clear using previously existing value', async () => {
        await cache.clear()
        assert.equal(await cache.hasValue(val123), false)
      })
    })

    describe('get()', () => {
      it('should return the correct value for the provided key', async () => {
        assert.deepEqual(await cache.get(val123), val123)
      })

      it('should return null for a non-existing entry', async () => {
        assert.equal(await cache.get('val345'), null)
      })
    })

    describe('getAll()', () => {
      it('should return map of mapped keys that match the provided keys', async () => {
        const entries = await cache.getAll([val123, val234, val345, 'val789'])
        await test.compareEntries([[val123, val123], [val234, val234], [val345, val345]], entries)
      })
    })

    describe('getOrDefault()', () => {
      it('should return the mapped value when the key is mapped', async () => {
        assert.deepEqual(await cache.getOrDefault(val123, val234), val123)
      })

      it('should return the provided default if the key is not mapped', async () => {
        assert.deepEqual(await cache.getOrDefault('val345', val234), val234)
      })
    })

    describe('put()', () => {
      it('should return the previously mapped value when key is value is updated', async () => {
        assert.deepEqual(await cache.set(val123, val345), val123)
      })

      it('should return null when inserting a new mapping', async () => {
        await cache.clear()
        assert.deepEqual(await cache.set(val123, val123), null)
      })
    })

    describe('empty', () => {
      it('should return false when the cache is empty', async () => {
        assert.deepEqual(await cache.empty, false)
      })

      it('should return true when the cache is empty', async () => {
        await cache.clear()
        assert.deepEqual(await cache.empty, true)
      })
    })

    describe('forEach()', () => {
      it('should iterate over the entries associated with the key and invoke the callback', async () => {
        const entriesSeen = new Set()
        await cache.forEach([val123, val456], (key, value) => entriesSeen.add([key, value]))
        await test.compareElements([[val123, val123], [val456, val456]], entriesSeen)
      })
    })

    describe('entries()', async () => {
      it('should return a set of all entries within the cache', async () => {
        const entries = await cache.entries()
        assert.equal(await entries.size, 4)
        assert.equal(entries instanceof Set, false)
        assert.equal(entries.hasOwnProperty('namedCache'), true)
        await test.compareEntries([[val123, val123], [val234, val234], [val345, val345], [val456, val456]],
          entries)
      })

      it('should be filterable', async () => {
        const entries = await cache.entries(Filters.greater(Extractors.extract('ival'), 123))
        assert.equal(await entries.size, 3)
        assert.equal(entries.hasOwnProperty('namedCache'), false)
        await test.compareEntries([[val234, val234], [val345, val345], [val456, val456]],
          entries)
      })
    })

    describe('keySet()', async () => {
      it('should return a set of all keys within the cache', async () => {
        const keySet = await cache.keys()
        assert.equal(await keySet.size, 4)
        assert.equal(keySet instanceof Set, false)
        assert.equal(keySet.hasOwnProperty('namedCache'), true)
        await test.compareElements([val123, val234, val345, val456], keySet)
      })

      it('should be filterable', async () => {
        const keySet = await cache.keys(Filters.greater(Extractors.extract('ival'), 123))
        assert.equal(await keySet.size, 3)
        assert.equal(keySet.hasOwnProperty('namedCache'), false)
        await test.compareElements([val234, val345, val345], await keySet)
      })
    })

    describe('values()', async () => {
      it('should return a set of all values within the cache', async () => {
        const values = await cache.values()
        assert.equal(await values.size, 4)
        assert.equal(values instanceof Set, false)
        assert.equal(values.hasOwnProperty('namedCache'), true)
        await test.compareElements([val123, val234, val345, val345], values)
      })

      it('should be filterable', async () => {
        const values = await cache.values(Filters.greater(Extractors.extract('ival'), 123))
        assert.equal(await values.size, 3)
        assert.equal(values.hasOwnProperty('namedCache'), false)
        await test.compareElements([val234, val345, val345], await values)
      })
    })
    describe('The cache lifecycle', () => {
      it('should generate \'released\' event when the cache is released', async () => {
        const sess = new SessionBuilder().build()
        const cache = sess.getCache('test')

        const prom = new Promise((resolve) => {
          cache.on(event.CacheLifecycleEvent.RELEASED, cacheName => {
            if (cacheName === 'test') {
              resolve()
            }
          })

          setTimeout(() => {
            cache.release()
          }, 100)
        })

        await prom.finally(() => sess.close().finally(() => sess.waitUntilClosed()))
      })

      it('should generate \'destroyed\' event when the cache is destroyed', async () => {
        const sess = new SessionBuilder().build()
        const cache = sess.getCache('test')

        const prom = new Promise((resolve) => {
          cache.on(event.CacheLifecycleEvent.DESTROYED, cacheName => {
            if (cacheName === 'test') {
              resolve()
            }
          })

          setTimeout(() => {
            cache.destroy()
          }, 100)
        })

        await prom.finally(() => sess.close().finally(() => sess.waitUntilClosed()))
      })
    })
  })
})
