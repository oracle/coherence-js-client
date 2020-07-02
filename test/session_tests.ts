/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { suite, test, timeout } from '@testdeck/mocha'

import { SessionBuilder } from '../src/cache/session'

export const assert = require('assert').strict;

describe('Session IT Test Suite', () => {
  describe('Session Unit Tests', () => {
    @suite(timeout(15000))
    class SessionTestsSuite {
      @test
      async shouldBeDefaultAddressWithDefaultSessionBuilder () {
        const builder = new SessionBuilder()
        assert.equal(builder.getSessionOptions().address, SessionBuilder.DEFAULT_ADDRESS)
        assert.equal(builder.getSessionOptions().tlsEnabled, false)
      }

      @test
      async shouldBeAbleToSpecifyAddressWithBuilder () {
        const builder = new SessionBuilder()
        builder.withAddress('abc:1234')
        assert.equal(builder.getSessionOptions().address, 'abc:1234')
        assert.equal(builder.getSessionOptions().tlsEnabled, false)
      }

      @test
      async shouldBeAbleToSpecifyRequestTimeoutWithBuilder () {
        const builder = new SessionBuilder()
        builder.withRequestTimeout(1234)
        assert.equal(builder.getSessionOptions().address, SessionBuilder.DEFAULT_ADDRESS)
        assert.equal(builder.getSessionOptions().tlsEnabled, false)
        assert.equal(builder.getSessionOptions().requestTimeoutInMillis, 1234)
      }

      @test
      async shouldBeAbleToSpecifyTlsWithBuilder () {
        const builder = new SessionBuilder()
        builder.enableTls()
        assert.equal(builder.getSessionOptions().address, SessionBuilder.DEFAULT_ADDRESS)
        assert.equal(builder.getSessionOptions().tlsEnabled, true)
      }

      @test
      async shouldCreateCacheWithDefaultAddress () {
        const sess = new SessionBuilder().build()
        const cache = sess.getCache('sess-test-1')
        await cache.put('a', 'abc')
        assert.equal(await cache.size(), 1)

        await sess.close()
        await sess.waitUntilClosed()
        assert.equal(sess.isClosed(), true)
      }

      @test
      async shouldHaveZeroActiveCachesOnCreation () {
        const sess = new SessionBuilder()
          .withAddress('localhost:1408').build()

        assert.equal(sess.getActiveCacheCount(), 0)
        assert.equal(sess.getActiveCaches().length, 0)

        await sess.close()
      }

      @test
      async shouldHaveCacheNameAfterGetCache () {
        const sess = new SessionBuilder()
          .withAddress('localhost:1408').build()

        sess.getCache('sess-cache')
        assert.equal(sess.getActiveCacheCount(), 1)
        assert.equal(sess.getActiveCaches()[0].getCacheName(), 'sess-cache')

        await sess.close()
      }

      @test
      async shouldReturnSameIntanceForSameCacheName () {
        const sess = new SessionBuilder()
          .withAddress('localhost:1408').build()

        const cache1 = sess.getCache('sess-cache')
        const cache2 = sess.getCache('sess-cache')

        assert.equal(sess.getActiveCacheCount(), 1)
        assert.equal(sess.getActiveCaches()[0].getCacheName(), 'sess-cache')

        assert.equal(cache1, cache2)
        await sess.close()
      }

      @test
      async shouldReturnDifferentIntancesOfActiveCachesForDifferentCacheName () {
        const sess = new SessionBuilder()
          .withAddress('localhost:1408').build()

        const cache1 = sess.getCache('sess-cache-1')
        const cache2 = sess.getCache('sess-cache-2')

        assert.equal(cache1.isActive(), true)
        assert.equal(cache2.isActive(), true)

        assert.equal(sess.getActiveCacheCount(), 2)
        assert.deepEqual(sess.getActiveCacheNames(), new Set(['sess-cache-1', 'sess-cache-2']))

        assert.notDeepEqual(cache1, cache2)
        await sess.close()
      }

      @test
      async shouldHaveReleasedAllCachesOnSessionClose () {
        const sess = new SessionBuilder()
          .withAddress('localhost:1408').build()

        const cache1 = sess.getCache('sess-cache-1')
        const cache2 = sess.getCache('sess-cache-2')

        assert.equal(sess.getActiveCacheCount(), 2)
        assert.deepEqual(sess.getActiveCacheNames(), new Set(['sess-cache-1', 'sess-cache-2']))

        assert.notDeepEqual(cache1, cache2)
        await sess.close()
        await sess.waitUntilClosed()

        assert.equal(sess.getActiveCacheCount(), 0)
        assert.deepEqual(sess.getActiveCacheNames(), new Set([]))

        assert.equal(cache1.isActive(), false)
        assert.equal(cache2.isActive(), false)
      }

      @test
      async shouldReleaseCacheFromSessionOnCacheRelease () {
        const sess = new SessionBuilder()
          .withAddress('localhost:1408').build()

        const cache1 = sess.getCache('sess-test-cache-1')
        const cache2 = sess.getCache('sess-test-cache-2')

        assert.equal(sess.getActiveCacheCount(), 2)
        assert.deepEqual(sess.getActiveCacheNames(), new Set(['sess-test-cache-1', 'sess-test-cache-2']))

        assert.notDeepEqual(cache1, cache2)
        const prom = new Promise((resolve) => {
          cache1.on('cache_released', (cacheName: string) => {
            if (cacheName == 'sess-test-cache-1') {
              resolve()
            }
          })
        })
        await cache1.release()
        await prom

        assert.equal(sess.getActiveCacheCount(), 1)
        assert.deepEqual(sess.getActiveCacheNames(), new Set(['sess-test-cache-2']))

        assert.equal(cache1.isActive(), false)
        assert.equal(cache2.isActive(), true)

        await sess.close()
        await sess.waitUntilClosed()

        assert.equal(sess.getActiveCacheCount(), 0)
        assert.deepEqual(sess.getActiveCacheNames(), new Set([]))

        assert.equal(cache1.isActive(), false)
        assert.equal(cache2.isActive(), false)
      }
    }
  })
})
