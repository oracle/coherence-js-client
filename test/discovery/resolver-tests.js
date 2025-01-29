/*
 * Copyright (c) 2025, Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * https://oss.oracle.com/licenses/upl.
 */

const { CoherenceResolver, Session } = require('../../lib')
const assert = require('assert').strict
const { describe, it } = require('mocha');

describe('CoherenceResolver Test Suite (unit/IT)', () => {
  describe('A CoherenceResolver', () => {

    function createListener(done, expectedPort) {
      return {
        onSuccessfulResolution: (
            addressList,
            serviceConfig,
            serviceConfigError,
            configSelector,
            attributes
        ) => {
          try {
            assert.equal(addressList.length, 1)
            assert.equal(addressList[0].addresses[0].host, '127.0.0.1')
            assert.equal(addressList[0].addresses[0].port, expectedPort)
            done()
          } catch (error) {
            done(error)
          }
        },
        onError(error) {
          done(new Error(`Unexpected error resolving: ${JSON.stringify(error)}`))
        }
      }
    }

    it('should parse and resolve the connection format \'coherence:///[host]\'', (done) => {
      const resolver = new CoherenceResolver({scheme: 'coherence', path: 'localhost'}, createListener(done, 10000), null)
      resolver.updateResolution()
    })

    it('should parse and resolve the connection format \'coherence:///[host]:[port]\'', (done) => {
      const resolver = new CoherenceResolver({scheme: 'coherence', path: 'localhost:7574'}, createListener(done, 10000), null)
      resolver.updateResolution()
    })

    it('should parse and resolve the connection format \'coherence:///[host]:[clusterName]\'', (done) => {
      const resolver = new CoherenceResolver({scheme: 'coherence', path: 'localhost:grpc-cluster2'}, createListener(done, 10001), null)
      resolver.updateResolution()
    })

    it('should parse and resolve the connection format \'coherence:///[host]:[port]:[clusterName]\'', (done) => {
      const resolver = new CoherenceResolver({scheme: 'coherence', path: 'localhost:7574:grpc-cluster2'}, createListener(done, 10001), null)
      resolver.updateResolution()
    })
  })

  describe('A Session', () => {
    it('should be able to resolve the gRPC Proxy', async () => {
      const session = new Session({address: 'coherence:///localhost'})
      const cache = session.getCache('test')
      await cache.set('a', 'b')
      assert.equal(await cache.get('a'), 'b')
      await session.close()
    })

    it('should be able to resolve the gRPC Proxy of a foreign cluster', async () => {
      const session = new Session({address: 'coherence:///localhost:grpc-cluster2'})
      const cache = session.getCache('test')
      await cache.set('a', 'b')
      assert.equal(await cache.get('a'), 'b')
      console.log("HERE")
      await session.close()
    })
  })
})