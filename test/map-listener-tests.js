/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

const { event, Filters, filter, SessionBuilder } = require('@oracle/coherence')
const events = require('events')
const assert = require('assert').strict
const { describe, it } = require('mocha');

describe('MapListener IT Test Suite', function () {
  const session = new SessionBuilder().build()
  const stringify = JSON.stringify
  const debug = process.env.DEBUG || false

  this.timeout(10000)

  async function runBasicEventTest (expectedEvents /* object */, filterMask /* number */) {
    const cache = session.getCache('event-map')
    const prom = new Promise((resolve) => {
      cache.on(event.CacheLifecycleEvent.DESTROYED, () => {
        resolve()
      })
    })

    const listener = new CountingMapListener('listener-default')
    setImmediate(async () => {
      if (filterMask) {
        await cache.addMapListener(listener, Filters.event(Filters.always(), filterMask))
      } else {
        await cache.addMapListener(listener)
      }

      await cache.set('123', { xyz: '123-xyz' })
      await cache.set('123', { abc: '123-abc' })
      await cache.delete('123')

      let numberOfEvents = expectedEvents.inserts.length + expectedEvents.updates.length + expectedEvents.deletes.length

      listener.waitFor(numberOfEvents).catch(error => console.log(error)).finally(() => cache.destroy())
    })

    await prom

    validateEventsForListener(listener, expectedEvents)
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
        const actualKey = actualEvent.getKey()
        assert.deepEqual(actualKey, expectedKey, 'Unexpected event order; expected key: '
          + stringify(expectedKey) + ', received: ' + stringify(actualKey))
        if (expectedEvent.new) {
          assert.deepEqual(actualEvent.getNewValue(), expectedEvent.new, 'Unexpected event order; expected new value: '
            + stringify(expectedEvent.new) + ', received: ' + stringify(actualEvent.getNewValue()))
        } else {
          assert.equal(actualEvent.getNewValue(), null, 'Unexpected event order; event incorrectly has new value')
        }

        if (expectedEvent.old) {
          assert.deepEqual(actualEvent.getOldValue(), expectedEvent.old, 'Unexpected event order; expected old value: '
            + stringify(expectedEvent.old) + ', received: ' + stringify(actualEvent.getOldValue()))
        } else {
          assert.equal(actualEvent.getOldValue(), null, 'Unexpected event order; event incorrectly has old value')
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
          assert.deepEqual(key, receivedEvent.getKey())
          keyFound = true
        } catch (error) {
        }

        if (expectedEvent.new) {
          if (!receivedEvent.getNewValue()) {
            assert.fail('[' + mode + '] Expected event for key ' + stringify(key) + ' to have new value, but none was found')
          } else {
            assert.deepEqual(expectedEvent.new, receivedEvent.getNewValue(), '[' + mode + '] Unexpected new value found for event keyed by ' + stringify(key))
          }
        } else {
          if (receivedEvent.new) {
            assert.fail('[' + mode + '] Did not expect event for key ' + stringify(key) + ' to have new value, but found' + stringify(receivedEvent.getNewValue()))
          }
        }

        if (expectedEvent.old) {
          if (!receivedEvent.getOldValue()) {
            assert.fail('[' + mode + '] Expected event for key ' + stringify(key) + ' to have old value, but none was found')
          } else {
            assert.deepEqual(expectedEvent.old, receivedEvent.getOldValue(), '[' + mode + '] Unexpected old value found for event keyed by ' + stringify(key))
          }
        } else {
          if (receivedEvent.old) {
            assert.fail('[' + mode + '] Did not expect event for key ' + stringify(key) + ' to have old value, but found' + stringify(receivedEvent.getOldValue()))
          }
        }
      }

      if (!keyFound) {
        assert.fail('Unable to find insert event for key ' + stringify(key))
      }
    }
  }

  describe('A MapListener', () => {
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

    it('should properly handle multiple listeners', async () => {
      const cache = session.getCache('map-list-3')
      const prom = new Promise((resolve) => {
        cache.on(event.CacheLifecycleEvent.DESTROYED, () => {
          resolve()
        })
      })
      const listener = new CountingMapListener('listener-default')
      const listener2 = new CountingMapListener('listener-2')

      let failure

      setImmediate(async () => {
        await cache.addMapListener(listener, true)

        await cache.set('123', { xyz: '123-xyz' })
        await cache.set('123', { abc: '123-abc' })
        await cache.delete('123')

        await listener.waitFor(3).catch(error => failure = error)
        if (failure) {
          cache.destroy().catch(error => console.log('cache destroy raised error: ' + error))
          return
        }
        await cache.addMapListener(listener2)

        await cache.set('123', { a: 2 })
        await cache.set('123', { a: 1 })
        await cache.removeMapListener(listener)
        await cache.delete('123')

        await listener.waitFor(5).catch(error => failure = error) // no delete due to de-registration
        if (failure) {
          cache.destroy().catch(error => console.log('cache destroy raised error: ' + error))
          return
        }

        await listener2.waitFor(3).catch(error => failure = error)
        if (failure) {
          cache.destroy().catch(error => console.log('cache destroy raised error: ' + error))
        }

        await cache.destroy()
      })

      await prom

      if (failure) {
        assert.fail(failure)
      }
    })

    it('should be registrable with a key', async () => {
      const cache = session.getCache('event-map')
      const prom = new Promise((resolve) => {
        cache.on(event.CacheLifecycleEvent.DESTROYED, () => {
          resolve()
        })
      })

      const listener = new CountingMapListener('listener-default')
      let failure
      setImmediate(async () => {
        await cache.addMapListener(listener, '123')

        await cache.set('123', { xyz: '123-xyz' })
        await cache.set('234', { abc: '123-abc' })
        await cache.delete('123')

        listener.waitFor(2).catch(error => failure = error).finally(() => cache.destroy())
      })

      await prom

      if (failure) {
        assert.fail(failure)
      }

      validateEventsForListener(listener, {
        'inserts': [{ key: '123', new: { xyz: '123-xyz' } }],
        'updates': [],
        'deletes': [{ key: '123', old: { xyz: '123-xyz' } }],
        'order': [{ key: '123', new: { xyz: '123-xyz' } }, { key: '123', old: { xyz: '123-xyz' } }]
      })
    })

    it('should be registrable with a filter', async () => {
      const cache = session.getCache('event-map')
      const prom = new Promise((resolve) => {
        cache.on(event.CacheLifecycleEvent.DESTROYED, () => {
          resolve()
        })
      })

      let failure
      const listener = new CountingMapListener('listener-default')
      setImmediate(async () => {
        await cache.addMapListener(listener, Filters.event(Filters.isNotNull('xyz')))

        await cache.set('123', { xyz: '123-xyz' })
        await cache.set('234', { abc: '123-abc' })
        await cache.delete('123')

        await listener.waitFor(2).catch(error => failure = error).finally(() => cache.destroy())

      })

      await prom

      if (failure) {
        assert.fail(failure)
      }

      validateEventsForListener(listener, {
        'inserts': [{ key: '123', new: { xyz: '123-xyz' } }],
        'updates': [],
        'deletes': [{ key: '123', old: { xyz: '123-xyz' } }],
        'order': [{ key: '123', new: { xyz: '123-xyz' } }, { key: '123', old: { xyz: '123-xyz' } }]
      })
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
      if (this.counter >= numberOfEvents) {
        return Promise.reject('Received more events than expected.  Expected: ' + numberOfEvents + ', actual: ' + this.counter)
      }
      return this.promiseTimeout(5000, new Promise((resolve, reject) => {
        this.on('event', () => {
          if (this.counter === numberOfEvents) {
            resolve()
          }
          if (this.counter >= numberOfEvents) {
            return reject('Received more events than expected.  Expected: ' + numberOfEvents + ', actual: ' + this.counter)
          }
        })
      }))
    }

    promiseTimeout (ms, promise) {
      let id
      let timeout = new Promise((resolve, reject) => {
        id = setTimeout(() => {
          reject('Timed out waiting for events in ' + ms + 'ms.')
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
        console.log('Received \'delete\' event: {key: ' +
          stringify(event.getKey()) + ', new-value: ' + stringify(event.getNewValue()) +
          ', old-value: ' + stringify(event.getOldValue()) + '}')
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
        console.log('Received \'insert\' event: {key: ' +
          stringify(event.getKey()) + ', new-value: ' + stringify(event.getNewValue()) +
          ', old-value: ' + stringify(event.getOldValue()) + '}')
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
        console.log('Received \'updated\' event: {key: ' +
          stringify(event.getKey()) + ', new-value: ' + stringify(event.getNewValue()) +
          ', old-value: ' + stringify(event.getOldValue()) + '}')
      }
      super.emit('event', 'update')
    }
  }
})
