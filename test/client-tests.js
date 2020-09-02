/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

const { event, Filters, Extractors, Session, Aggregators } = require('../lib')
const test = require('./util')
const assert = require('assert').strict
const { describe, it, after, beforeEach } = require('mocha')
const MapListener = event.MapListener

describe('NamedCacheClient IT Test Suite', function () {
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

  after(async () => {
    await cache.release().finally(() => session.close().catch())
  })

  describe('The cache lifecycle', () => {
    const CACHE_NAME = 'lifecycle-cache'

    it('should generate \'released\' event when the cache is released', async () => {
      const cache = session.getCache(CACHE_NAME)

      const prom = new Promise((resolve) => {
        cache.on(event.MapLifecycleEvent.RELEASED, cacheName => {
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
        cache.on(event.MapLifecycleEvent.DESTROYED, cacheName => {
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
      it('should iterate over the entries associated with the specified keys and invoke the callback', async () => {
        const entriesSeen = new Set()
        await cache.clear()
        await cache.set('123', val123).then(() => cache.set('234', val234))
        await cache.set('345', val345)
        await cache.set('456', val456)
        await cache.forEach((value, key) => entriesSeen.add([value, key]), ['123', '456'])
        await test.compareElements([[val123, '123'], [val456, '456']], entriesSeen)
      })

      it('should iterate over all entries invoke the callback for each', async () => {
        const entriesSeen = new Set()
        await cache.clear()
        await cache.set('123', val123).then(() => cache.set('234', val234))
        await cache.set('345', val345)
        await cache.set('456', val456)
        await cache.forEach((value, key) => entriesSeen.add([value, key]))
        await test.compareElements([[val123, '123'], [val234, '234'], [val345, '345'], [val456, '456']], entriesSeen)
      })

      it('should iterate over all filtered entries and invoke the callback for each', async () => {
        const entriesSeen = new Set()
        await cache.clear()
        await cache.set('123', val123).then(() => cache.set('234', val234))
        await cache.set('345', val345)
        await cache.set('456', val456)
        await cache.forEach((value, key) => entriesSeen.add([value, key]), Filters.greater('ival', 300))
        await test.compareElements([[val345, '345'], [val456, '456']], entriesSeen)
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

    describe('keySet()', () => {
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

    describe('removeMapping()', () => {
      it('should return true if a mapping was removed', async () => {
        assert.equal(await cache.removeMapping(val123, val123), true)
        assert.equal(await cache.size, 3)
      })

      it('should return false if a mapping was not removed', async () => {
        assert.equal(await cache.removeMapping('val123', val123), false)
        assert.equal(await cache.size, 4)
      })
    })

    describe('replace()', () => {
      it('should return null if the mapping does not exist and does not result in an entry in the map', async () => {
        assert.equal(await cache.replace('val123', 'val123'), null)
        assert.equal(await cache.size, 4)
      })

      it('should return the previously mapped value if the mapping is replaced', async () => {
        assert.deepEqual(await cache.replace(val123, 'val123'), val123)
        assert.equal(await cache.size, 4)
        assert.equal(await cache.get(val123), 'val123')
      })
    })

    describe('replaceMapping()', () => {
      it('should return false if the mapping does not exist', async () => {
        assert.equal(await cache.replaceMapping(val123, 'val123', 'NOPE'), false)
        assert.equal(await cache.size, 4)
        assert.deepEqual(await cache.get(val123), val123)
      })

      it('should return true if the mapping was replaced', async () => {
        assert.equal(await cache.replaceMapping(val123, val123, val456), true)
        assert.equal(await cache.size, 4)
        assert.deepEqual(await cache.get(val123), val456)
      })
    })

    describe('setIfAbsent()', () => {
      it('should return null if the mapping is absent and result in a new entry', async () => {
        assert.equal(await cache.setIfAbsent('val123', val123), null)
        assert.equal(await cache.size, 5)
        assert.deepEqual(await cache.get('val123'), val123)
      })

      it('should return the currently mapped value if the mapping exists and does not mutate the map', async () => {
        assert.deepEqual(await cache.setIfAbsent(val123, val345), val123)
        assert.equal(await cache.size, 4)
        assert.deepEqual(await cache.get(val123), val123)
      })
    })

    describe('set() with TTL', () => {
      it('should be possible to associate a ttl with a cache entry', async () => {
        await cache.set('val123', val123, 1000)
        assert.deepEqual(await cache.get('val123'), val123)
        assert.deepEqual(await cache.get('val123'), val123)
        assert.deepEqual(await cache.get('val123'), val123)
        await new Promise(resolve => setTimeout(resolve, 1500))
        assert.equal(await cache.get('val123'), null)
      })
    })

    describe('setAll()', () => {
      it('should be to store a map of entries', async () => {
        await cache.clear();
        await cache.setAll(new Map().set(val123, val123).set(val234, val234))
        assert.equal(await cache.size, 2)
        assert.deepEqual(await cache.get(val123), val123)
        assert.deepEqual(await cache.get(val234), val234)
      })
    })

    describe('{add,remove}Index()', () => {
      it('should add and remove an index to the remote cache', async () => {
        await cache.addIndex(Extractors.extract('ival'))
        const result = await cache.aggregate(Filters.greater('ival', 200), Aggregators.record())
        assert.notEqual(JSON.stringify(result).indexOf('"index":'), -1)

        await cache.removeIndex(Extractors.extract('ival'))
        const result2 = await cache.aggregate(Filters.greater('ival', 200), Aggregators.record())
        assert.equal(JSON.stringify(result2).indexOf('"index":'), -1)
      })
    })

    describe('truncate()', () => {
      it('should clear the cache without raising listener events', async () => {
        let deleteCount = 0
        const listener = new MapListener().on(event.MapEventType.DELETE, () => deleteCount++)
        await cache.addMapListener(listener).then(() => cache.truncate()).then(() => cache.removeMapListener(listener))

        assert.equal(await cache.size, 0)
        assert.equal(deleteCount, 0)
      })
    })

    describe('values()', () => {
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
        const sess = new Session()
        const cache = sess.getCache('test')

        const prom = new Promise((resolve) => {
          cache.on(event.MapLifecycleEvent.RELEASED, cacheName => {
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
        const sess = new Session()
        const cache = sess.getCache('test')

        const prom = new Promise((resolve) => {
          cache.on(event.MapLifecycleEvent.DESTROYED, cacheName => {
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
