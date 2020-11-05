/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

const { event, Session } = require('../lib')
const assert = require('assert').strict
const { describe, it } = require('mocha');
const path = require('path')

describe('Session Tests Suite (unit/IT)', () => {
  describe('Session Unit Test Suite', () => {
    describe('A SessionBuilder', () => {
      it('should have the expected defaults', () => {
        const session = new Session()

        assert.equal(session.address, Session.DEFAULT_ADDRESS)
        assert.equal(session.options.requestTimeoutInMillis, 60000)
        assert.equal(session.options.tls.enabled, false)
        assert.equal(session.options.tls.caCertPath, undefined)
        assert.equal(session.options.tls.clientCertPath, undefined)
        assert.equal(session.options.tls.clientKeyPath, undefined)
        assert.equal(session.options.format, Session.DEFAULT_FORMAT)
      })

      it('should be able to specify a custom address', () => {
        const session = new Session({ address: 'localhost:14444' })
        assert.equal(session.address, 'localhost:14444')
      })

      it('should be able to specify a custom request timeout', () => {
        const session = new Session({ requestTimeoutInMillis: 1000 })
        assert.equal(session.options.requestTimeoutInMillis, 1000)
      })

      it ('should be possible to specify a custom scope', () => {
        const session = new Session({ scope: 'test' })
        assert.equal(session.options.scope, 'test')
        assert.equal(session.scope, 'test')
      })

      it ('should be possible to specify a custom channel options', () => {
        const session = new Session({ channelOptions: {'grpc.max_receive_message_length': 1024 * 1024 * 1024 }})
        assert.deepEqual(session.options.channelOptions, {'grpc.max_receive_message_length': 1024 * 1024 * 1024 })
      })

      it('should be able to specify custom call options', () => {
        const fn = function () { Date.now() }
        const session = new Session({ callOptions: fn})
        assert.equal(session.options.callOptions, fn)
      })

      it('should be able enable tls', () => {
        const opts1 = {
          tls: {
            enabled: true,
            clientKeyPath: path.normalize(process.cwd() + '/etc/cert/clientKey.pem'),
            clientCertPath: path.normalize(process.cwd() + '/etc/cert/clientCert.pem'),
            caCertPath: path.normalize(process.cwd() + '/etc/cert/ca.pem') }
        }
        const session = new Session(opts1)

        assert.equal(session.options.tls.enabled, true)
        assert.equal(session.options.tls.caCertPath, process.cwd() + '/etc/cert/ca.pem')
        assert.equal(session.options.tls.clientCertPath, process.cwd() + '/etc/cert/clientCert.pem')
        assert.equal(session.options.tls.clientKeyPath, process.cwd() + '/etc/cert/clientKey.pem')
      })
    })
  })

  describe('Session IT Test Suite', () => {
    describe('A Session', () => {
      it('should not have active sessions upon creation', async () => {
        const sess = new Session()

        assert.equal(sess.activeCacheCount, 0)
        assert.equal(sess.activeCaches.length, 0)

        await sess.close()
      })

      it('should have active sessions after getCache() is called', async () => {
        const sess = new Session()

        sess.getCache('sess-cache')
        assert.equal(sess.activeCacheCount, 1)
        assert.equal(sess.activeCaches[0].name, 'sess-cache')

        await sess.close()
      })

      it('should return the same cache instance upon multiple getCache() invocations for the same cache', async () => {
        const sess = new Session()

        const cache1 = sess.getCache('sess-cache')
        const cache2 = sess.getCache('sess-cache')
        assert.equal(sess.activeCacheCount, 1)
        assert.equal(sess.activeCaches[0].name, 'sess-cache')
        assert.equal(cache1, cache2)
        assert.deepEqual(cache1, cache2)

        await sess.close()
      })

      it('should return the same cache instance upon multiple getMap() invocations for the same map', async () => {
        const sess = new Session()

        const map1 = sess.getMap('sess-map')
        const map2 = sess.getMap('sess-map')
        assert.equal(sess.activeCacheCount, 1)
        assert.equal(sess.activeCaches[0].name, 'sess-map')
        assert.equal(map1, map2)
        assert.deepEqual(map1, map2)

        await sess.close()
      })

      it('should return different cache instances for differing getCache() invocations', async () => {
        const sess = new Session()

        const cache1 = sess.getCache('sess-cache')
        const cache2 = sess.getCache('sess-cache2')
        assert.equal(sess.activeCacheCount, 2)
        assert.deepEqual(sess.activeCacheNames, new Set(['sess-cache', 'sess-cache2']))
        assert.notEqual(cache1, cache2)
        assert.notDeepEqual(cache1, cache2)

        await sess.close()
      })

      it('should return different cache instances for differing getMap() invocations', async () => {
        const sess = new Session()

        const map1 = sess.getCache('sess-map')
        const map2 = sess.getCache('sess-map2')
        assert.equal(sess.activeCacheCount, 2)
        assert.deepEqual(sess.activeCacheNames, new Set(['sess-map', 'sess-map2']))
        assert.notEqual(map1, map2)
        assert.notDeepEqual(map1, map2)

        await sess.close()
      })

      it('should getCache() should return the same instance as getMap() for the same name', async () => {
        const sess = new Session()

        const cache = sess.getCache('sess-test')
        const map = sess.getMap('sess-test')

        assert.equal(cache, map)

        await sess.close()
      })

      it('should release active caches when closed', async () => {
        const sess = new Session()

        const cache1 = sess.getCache('sess-cache-1')
        const cache2 = sess.getCache('sess-cache-2')

        assert.equal(sess.activeCacheCount, 2)
        assert.deepEqual(sess.activeCacheNames, new Set(['sess-cache-1', 'sess-cache-2']))

        assert.notDeepEqual(cache1, cache2)
        await sess.close()
        await sess.waitUntilClosed()

        assert.equal(sess.activeCacheCount, 0)
        assert.deepEqual(sess.activeCacheNames, new Set([]))

        assert.equal(cache1.active, false)
        assert.equal(cache2.active, false)
      })

      it('should not maintain references to explicitly released caches', async () => {
        const sess = new Session()

        const cache1 = sess.getCache('sess-test-cache-1')
        const cache2 = sess.getCache('sess-test-cache-2')

        assert.equal(sess.activeCacheCount, 2)
        assert.deepEqual(sess.activeCacheNames, new Set(['sess-test-cache-1', 'sess-test-cache-2']))

        assert.notDeepEqual(cache1, cache2)
        const prom = new Promise((resolve) => {
          cache1.on(event.MapLifecycleEvent.RELEASED, (cacheName) => {
            if (cacheName === 'sess-test-cache-1') {
              resolve()
            }
          })
        })
        await cache1.release()
        await prom

        assert.equal(sess.activeCacheCount, 1)
        assert.deepEqual(sess.activeCacheNames, new Set(['sess-test-cache-2']))

        assert.equal(cache1.active, false)
        assert.equal(cache2.active, true)

        await sess.close()
        await sess.waitUntilClosed()

        assert.equal(sess.activeCacheCount, 0)
        assert.deepEqual(sess.activeCacheNames, new Set([]))

        assert.equal(cache1.active, false)
        assert.equal(cache2.active, false)
      })
    })

    describe('The session lifecycle', function () {
      const CACHE_NAME = 'lifecycle-cache'
      const CACHE2_NAME = 'lifecycle-cache2'
      this.timeout(10000)

      it('should trigger a \'released\' event for each active cache', async () => {
        const cache2Name = CACHE_NAME + '2'
        const sess = new Session()
        const cache = sess.getCache(CACHE_NAME)
        const cache2 = sess.getCache(cache2Name)

        let destroyed1 = false
        const prom1 = new Promise((resolve, reject) => {
          cache.on(event.MapLifecycleEvent.RELEASED, cacheName => {
            if (cacheName === CACHE_NAME) {
              resolve()
            }
          })
          cache.on(event.MapLifecycleEvent.DESTROYED, cacheName => {
            destroyed1 = true
            reject('Session close incorrectly triggered cache \'destroyed\' event for cache ' + cacheName)
          })
        })

        let destroyed2 = false
        const prom2 = new Promise((resolve, reject) => {
          cache2.on(event.MapLifecycleEvent.RELEASED, cacheName => {
            if (cacheName === CACHE2_NAME) {
              resolve()
            }
          })
          cache2.on(event.MapLifecycleEvent.DESTROYED, cacheName => {
            destroyed2 = true
            reject('Session close incorrectly triggered cache \'destroyed\' event for cache ' + cacheName)
          })
        })

        // trigger the events
        sess.close().then(() => sess.waitUntilClosed())

        await prom1
        await new Promise(r => setTimeout(r, 1000)) // wait to make sure the destroyed event isn't triggered
        if (destroyed1) {
          assert.fail('Cache1 incorrectly emitted cache a \'destroyed\' event')
        }

        await prom2
        await new Promise(r => setTimeout(r, 1000)) // wait to make sure the destroyed event isn't triggered
        if (destroyed2) {
          assert.fail('Cache2 incorrectly emitted cache a \'destroyed\' event')
        }
      })
    })
  })
})
