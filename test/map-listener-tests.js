/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

const { MapEventResponse } = require('../lib/grpc/messages_pb')
const { event, Filters, Session, filter } = require('../lib')
const events = require('events')
const assert = require('assert').strict
const { describe, it } = require('mocha')

describe('Map Events IT Test Suite', function () {
  const session = new Session()
  const stringify = JSON.stringify
  const debug = process.env.DEBUG || false

  this.timeout(10000)

  after(async () => {
    await session.close()
  })

  async function runBasicEventTest (expectedEvents /* object */, filterMask /* number */) {
    const cache = session.getCache('event-map')
    const prom = new Promise((resolve) => {
      cache.on(event.MapLifecycleEvent.DESTROYED, () => {
        resolve()
      })
    })

    const listener = new CountingMapListener('listener-default')
    setImmediate(async () => {
      const eventFilter = Filters.event(Filters.always(), filterMask)
      if (filterMask) {
        await cache.addMapListener(event.MapEventType.INSERT, (event) => listener.entryInserted(event), eventFilter)
        await cache.addMapListener(event.MapEventType.UPDATE, (event) => listener.entryUpdated(event), eventFilter)
        await cache.addMapListener(event.MapEventType.DELETE, (event) => listener.entryDeleted(event), eventFilter)
      } else {
        await cache.addMapListener(event.MapEventType.INSERT, (event) => listener.entryInserted(event))
        await cache.addMapListener(event.MapEventType.UPDATE, (event) => listener.entryUpdated(event))
        await cache.addMapListener(event.MapEventType.DELETE, (event) => listener.entryDeleted(event))
      }

      await cache.set('123', { xyz: '123-xyz' })
      await cache.set('123', { abc: '123-abc' })
      await cache.delete('123')

      let numberOfEvents = expectedEvents.inserts.length + expectedEvents.updates.length + expectedEvents.deletes.length

      listener.waitFor(numberOfEvents).catch(error => console.log(error)).finally(() => cache.destroy())
    })

    await prom.then(() => validateEventsForListener(listener, expectedEvents)).catch(error => console.log(error))
  }

  function validateEventsForListener (listener, expectedEvents) {
    // validate inserts
    const expectedInserts = expectedEvents.inserts
    assert.equal(listener.insertEvents.length, expectedInserts.length, 'Unexpected number of insert events received')
    validateEvent('INSERT(' + listener.name + ')', expectedInserts, listener.insertEvents)

    // validate updates
    const expectedUpdates = expectedEvents.updates
    assert.equal(listener.updateEvents.length, expectedUpdates.length, 'Unexpected number of update events received')
    validateEvent('UPDATE(' + listener.name + ')', expectedUpdates, listener.updateEvents)

    // validate deletes
    const expectedDeletes = expectedEvents.deletes
    assert.equal(listener.deleteEvents.length, expectedDeletes.length, 'Unexpected number of update events received')
    validateEvent('DELETE(' + listener.name + ')', expectedDeletes, listener.deleteEvents)

    // validate ordering if required
    if (expectedEvents.order) {
      const expectedOrder = expectedEvents.order
      const actualOrder = listener.eventOrder
      assert.equal(actualOrder.length, expectedOrder.length, 'Unexpected length for all events.')
      for (let i = 0, len = expectedOrder.length; i < len; i++) {
        const expectedEvent = expectedOrder[i]
        const actualEvent = actualOrder[i]
        const expectedKey = expectedEvent.key
        const actualKey = actualEvent.key
        assert.deepEqual(actualKey, expectedKey, 'Unexpected event order; expected key: '
          + stringify(expectedKey) + ', received: ' + stringify(actualKey))
        if (expectedEvent.new) {
          assert.deepEqual(actualEvent.newValue, expectedEvent.new, 'Unexpected event order; expected new value: '
            + stringify(expectedEvent.new) + ', received: ' + stringify(actualEvent.newValue))
        } else {
          assert.equal(actualEvent.newValue, null, 'Unexpected event order; event incorrectly has new value')
        }

        if (expectedEvent.old) {
          assert.deepEqual(actualEvent.oldValue, expectedEvent.old, 'Unexpected event order; expected old value: '
            + stringify(expectedEvent.old) + ', received: ' + stringify(actualEvent.oldValue))
        } else {
          assert.equal(actualEvent.oldValue, null, 'Unexpected event order; event incorrectly has old value')
        }
      }
    }
  }

  function validateEvent (mode, expectedEvents, eventsReceived) {
    for (const expectedEvent of expectedEvents) {
      let keyFound = false
      const key = expectedEvent.key
      for (const receivedEvent of eventsReceived) {
        try {
          assert.deepEqual(key, receivedEvent.key)
          keyFound = true
        } catch (error) {
        }

        if (expectedEvent.new) {
          if (!receivedEvent.newValue) {
            assert.fail('[' + mode + '] Expected event for key ' + stringify(key) + ' to have new value, but none was found')
          } else {
            assert.deepEqual(expectedEvent.new, receivedEvent.newValue, '[' + mode + '] Unexpected new value found for event keyed by ' + stringify(key))
          }
        } else {
          if (receivedEvent.new) {
            assert.fail('[' + mode + '] Did not expect event for key ' + stringify(key) + ' to have new value, but found' + stringify(receivedEvent.newValue))
          }
        }

        if (expectedEvent.old) {
          if (!receivedEvent.oldValue) {
            assert.fail('[' + mode + '] Expected event for key ' + stringify(key) + ' to have old value, but none was found')
          } else {
            assert.deepEqual(expectedEvent.old, receivedEvent.oldValue, '[' + mode + '] Unexpected old value found for event keyed by ' + stringify(key))
          }
        } else {
          if (receivedEvent.old) {
            assert.fail('[' + mode + '] Did not expect event for key ' + stringify(key) + ' to have old value, but found' + stringify(receivedEvent.oldValue))
          }
        }
      }

      if (!keyFound) {
        assert.fail('Unable to find insert event for key ' + stringify(key))
      }
    }
  }

  describe('A MapEvent callback', () => {
    it('should be able to receive insert, update, and delete events in default registration case', async () => {
      const expected = {
        'inserts': [{ key: '123', new: { xyz: '123-xyz' } }],
        'updates': [{ key: '123', new: { abc: '123-abc' }, old: { xyz: '123-xyz' } }],
        'deletes': [{ key: '123', old: { abc: '123-abc' } }],
        'order': [{ key: '123', new: { xyz: '123-xyz' } },
          { key: '123', new: { abc: '123-abc' }, old: { xyz: '123-xyz' } },
          { key: '123', old: { abc: '123-abc' } }]
      }
      await runBasicEventTest(expected)
    })

    it('should be able to receive insert, update, and delete events in explicit registration case', async () => {
      const expected = {
        'inserts': [{ key: '123', new: { xyz: '123-xyz' } }],
        'updates': [{ key: '123', new: { abc: '123-abc' }, old: { xyz: '123-xyz' } }],
        'deletes': [{ key: '123', old: { abc: '123-abc' } }],
        'order': [{ key: '123', new: { xyz: '123-xyz' } },
          { key: '123', new: { abc: '123-abc' }, old: { xyz: '123-xyz' } },
          { key: '123', old: { abc: '123-abc' } }]
      }
      await runBasicEventTest(expected, filter.MapEventFilter.E_ALL)
    })

    it('should be able to receive insert events only', async () => {
      const expected = {
        'inserts': [{ key: '123', new: { xyz: '123-xyz' } }],
        'updates': [],
        'deletes': []
      }
      await runBasicEventTest(expected, filter.MapEventFilter.E_INSERTED)
    })

    it('should be able to receive update events only', async () => {
      const expected = {
        'inserts': [],
        'updates': [{ key: '123', new: { abc: '123-abc' }, old: { xyz: '123-xyz' } }],
        'deletes': []
      }
      await runBasicEventTest(expected, filter.MapEventFilter.E_UPDATED)
    })

    it('should be able to receive deleted events only', async () => {
      const expected = {
        'inserts': [],
        'updates': [],
        'deletes': [{ key: '123', old: { abc: '123-abc' } }]
      }
      await runBasicEventTest(expected, filter.MapEventFilter.E_DELETED)
    })

    it('should properly handle multiple listeners', (done) => {
      const cache = session.getCache('map-list-3')
      const prom = new Promise((resolve) => {
        cache.on(event.MapLifecycleEvent.DESTROYED, () => {
          resolve()
        })
      })
      const listener = new CountingMapListener('listener-default')
      const listener2 = new CountingMapListener('listener-2')

      setImmediate(async () => {
        const l1Inserted = (event) => listener.entryInserted(event)
        const l1Updated = (event) => listener.entryUpdated(event)
        const l1Deleted = (event) => listener.entryDeleted(event)
        await cache.addMapListener(event.MapEventType.INSERT, l1Inserted)
        await cache.addMapListener(event.MapEventType.UPDATE, l1Updated)
        await cache.addMapListener(event.MapEventType.DELETE, l1Deleted)

        await cache.set('123', { xyz: '123-xyz' })
        await cache.set('123', { abc: '123-abc' })
        await cache.delete('123')

        await listener.waitFor(3).catch(error => {
          cache.destroy().catch(error => console.log('cache destroy raised error: ' + error))
          throw error
        })

        await cache.addMapListener(event.MapEventType.INSERT, (event) => listener2.entryInserted(event))
        await cache.addMapListener(event.MapEventType.UPDATE, (event) => listener2.entryUpdated(event))
        await cache.addMapListener(event.MapEventType.DELETE, (event) => listener2.entryDeleted(event))

        await cache.set('123', { a: 2 })
        await cache.set('123', { a: 1 })

        await listener.waitFor(5).catch(error => {
          cache.destroy().catch(error => console.log('cache destroy raised error: ' + error))
          throw error
        })

        await cache.removeMapListener(event.MapEventType.INSERT, l1Inserted)
        await cache.removeMapListener(event.MapEventType.UPDATE, l1Updated)
        await cache.removeMapListener(event.MapEventType.DELETE, l1Deleted)
        await cache.delete('123')

        await listener2.waitFor(3).catch(error => {
          cache.destroy().catch(error => console.log('cache destroy raised error: ' + error))
          throw error
        })

        await cache.destroy()
      })

      prom.then(() => done()).catch(err => done(err))
    })

    it('should be registrable with a key', (done) => {
      const cache = session.getCache('event-map')
      const prom = new Promise((resolve) => {
        cache.on(event.MapLifecycleEvent.DESTROYED, () => {
          resolve()
        })
      })

      const listener = new CountingMapListener('listener-default')
      setImmediate(async () => {
        const l1Inserted = (event) => listener.entryInserted(event)
        const l1Updated = (event) => listener.entryUpdated(event)
        const l1Deleted = (event) => listener.entryDeleted(event)
        await cache.addMapListener(event.MapEventType.INSERT, l1Inserted, '123')
        await cache.addMapListener(event.MapEventType.UPDATE, l1Updated, '123')
        await cache.addMapListener(event.MapEventType.DELETE, l1Deleted, '123')

        await cache.set('123', { xyz: '123-xyz' })
        await cache.set('234', { abc: '123-abc' })
        await cache.delete('123')

        await listener.waitFor(2).catch(error => done(error)).finally(() => cache.destroy())
      })

      prom.then(() => {
        validateEventsForListener(listener, {
          'inserts': [{ key: '123', new: { xyz: '123-xyz' } }],
          'updates': [],
          'deletes': [{ key: '123', old: { xyz: '123-xyz' } }],
          'order': [{ key: '123', new: { xyz: '123-xyz' } }, { key: '123', old: { xyz: '123-xyz' } }]
        })
      }).then(() => done()).catch(error => done(error))
    })

    it('should be registrable with a filter', (done) => {
      const cache = session.getCache('event-map')
      const prom = new Promise((resolve) => {
        cache.on(event.MapLifecycleEvent.DESTROYED, () => {
          resolve()
        })
      })

      const listener = new CountingMapListener('listener-default')
      setImmediate(async () => {
        const mapEventFilter = Filters.event(Filters.isNotNull('xyz'))
        const l1Inserted = (event) => listener.entryInserted(event)
        const l1Updated = (event) => listener.entryUpdated(event)
        const l1Deleted = (event) => listener.entryDeleted(event)
        await cache.addMapListener(event.MapEventType.INSERT, l1Inserted, mapEventFilter)
        await cache.addMapListener(event.MapEventType.UPDATE, l1Updated, mapEventFilter)
        await cache.addMapListener(event.MapEventType.DELETE, l1Deleted, mapEventFilter)


        await cache.set('123', { xyz: '123-xyz' })
        await cache.set('234', { abc: '123-abc' })
        await cache.delete('123')

        await listener.waitFor(2).catch(error => console.log(error)).finally(() => cache.destroy())

      })

      prom.then(() => {
        validateEventsForListener(listener, {
          'inserts': [{ key: '123', new: { xyz: '123-xyz' } }],
          'updates': [],
          'deletes': [{ key: '123', old: { xyz: '123-xyz' } }],
          'order': [{ key: '123', new: { xyz: '123-xyz' } }, { key: '123', old: { xyz: '123-xyz' } }]
        })
      }).then(() => done()).catch(error => done(error))
    })
  })

  describe('A MapEvent', () => {
    it('should have the correct source', async () => {
      const cache = session.getCache('event-map')
      const prom = new Promise((resolve) => {
        cache.on(event.MapLifecycleEvent.DESTROYED, () => {
          resolve()
        })
      })

      await cache.addMapListener(event.MapEventType.INSERT, async (event) => {
        assert.deepEqual(event.source, cache)
        await cache.destroy()
      })

      await cache.set('a', 'b')
      await prom.catch((error) => assert.fail(error))
    })

    it('should have the same name as the source cache', async () => {
      const cache = session.getCache('event-map')
      const prom = new Promise((resolve) => {
        cache.on(event.MapLifecycleEvent.DESTROYED, () => {
          resolve()
        })
      })

      await cache.addMapListener(event.MapEventType.INSERT, async (event) => {
        assert.deepEqual(event.name, cache.name)
        await cache.destroy()
      })

      await cache.set('a', 'b')
      await prom.catch((error) => assert.fail(error))
    })

    it('should produce a readable description of the event type', async () => {
      const cache = session.getCache('event-map')
      const prom = new Promise((resolve) => {
        cache.on(event.MapLifecycleEvent.DESTROYED, () => {
          resolve()
        })
      })

      let count = 0
      const insert = async (event) => {
        assert.equal(event.description, 'insert')
        if (++count === 3) {
          await cache.destroy()
        }
      }
      const update = async (event) => {
        assert.equal(event.description, 'update')
        if (++count === 3) {
          await cache.destroy()
        }
      }
      const del = async (event) => {
        assert.equal(event.description, 'delete')
        if (++count === 3) {
          await cache.destroy()
        }
      }

      await cache.addMapListener(event.MapEventType.INSERT, insert)
      await cache.addMapListener(event.MapEventType.UPDATE, update)
      await cache.addMapListener(event.MapEventType.DELETE, del)

      await cache.set('a', 'b')
      await cache.set('a', 'c')
      await cache.delete('a')
      await prom.catch((error) => assert.fail(error))
    })

    it('should return unknown string for unknown event IDs', async () => {
      const cache = session.getCache('event-map')
      const response = new MapEventResponse()
      response.setId(8)
      const e = new event.MapEvent(cache, response, null)
      assert.equal(e.description, '<unknown: ' + 8 + '>')
      await cache.destroy()
    })

    it('should throw if key cannot be deserialized', async () => {
      const cache = session.getCache('event-map')
      const response = new MapEventResponse()
      response.setId(8)
      const e = new event.MapEvent(cache, response, {
        deserialize () {
          return undefined
        }, serialize () {
          return undefined
        }, format: 'Lossy'
      })
      assert.throws(() => e.getKey())
      await cache.destroy()
    })
  })

  class CountingMapListener extends events.EventEmitter {
    constructor (name) {
      super()
      this.name = name
      this.counter = 0
      this.insertEvents = []
      this.updateEvents = []
      this.deleteEvents = []
      this.eventOrder = []
    }

    waitFor (numberOfEvents) {
      if (this.counter === numberOfEvents) {
        return Promise.resolve()
      }
      if (this.counter > numberOfEvents) {
        return Promise.reject(new Error('Received more events than expected.  Expected: ' + numberOfEvents + ', actual: ' + this.counter))
      }
      return this.promiseTimeout(10000, new Promise((resolve, reject) => {
        this.on('event', () => {
          if (this.counter === numberOfEvents) {
            resolve()
          }
          if (this.counter > numberOfEvents) {
            return reject(new Error('Received more events than expected.  Expected: ' + numberOfEvents + ', actual: ' + this.counter))
          }
        })
      }))
    }

    promiseTimeout (ms, promise) {
      let id
      let timeout = new Promise((resolve, reject) => {
        id = setTimeout(() => {
          reject(new Error('Timed out waiting for events in ' + ms + 'ms.'))
        }, ms)
      })

      return Promise.race([
        promise,
        timeout
      ]).then((result) => {
        clearTimeout(id)
        return result
      })
    }

    // MapListener callback
    // noinspection JSUnusedGlobalSymbols
    entryDeleted (event) {
      this.deleteEvents.push(event)
      this.eventOrder.push(event)
      this.counter++
      if (debug) {
        console.log('[' + this.name + '] Received \'delete\' event: {key: ' +
          stringify(event.key) + ', new-value: ' + stringify(event.newValue) +
          ', old-value: ' + stringify(event.oldValue) + '}')
      }
      super.emit('event', 'delete')
    }

    // MapListener callback
    // noinspection JSUnusedGlobalSymbols
    entryInserted (event) {
      this.insertEvents.push(event)
      this.eventOrder.push(event)
      this.counter++
      if (debug) {
        console.log('[' + this.name + '] Received \'insert\' event: {key: ' +
          stringify(event.key) + ', new-value: ' + stringify(event.newValue) +
          ', old-value: ' + stringify(event.oldValue) + '}')
      }
      super.emit('event', 'insert')
    }

    // MapListener callback
    // noinspection JSUnusedGlobalSymbols
    entryUpdated (event) {
      this.updateEvents.push(event)
      this.eventOrder.push(event)
      this.counter++
      if (debug) {
        console.log('[' + this.name + '] Received \'updated\' event: {key: ' +
          stringify(event.key) + ', new-value: ' + stringify(event.newValue) +
          ', old-value: ' + stringify(event.oldValue) + '}')
      }
      super.emit('event', 'update')
    }
  }
})
