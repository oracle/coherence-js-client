/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

const { Filters, Extractors, util } = require('../lib')
const assert = require('assert').strict
const {
  ClearRequest, AddIndexRequest, ContainsEntryRequest, ContainsKeyRequest, ContainsValueRequest,
  GetRequest, EntrySetRequest, KeySetRequest, ValuesRequest
} = require('../lib/grpc/messages_pb')
const { describe, it } = require('mocha');

describe('The RequestFactory', function () {
  this.timeout(10000)
  const serializer = util.SerializerRegistry.instance().serializer('json')
  const reqFactory = new util.RequestFactory('States', 'test', serializer)

  const states = {
    ca: {
      name: 'California',
      abbreviation: 'CA',
      capital: 'Sacramento',
      tz: 'Pacific',
      population: 39, // 39.55
      neighbors: ['OR', 'NV', 'AZ']
    },
    ny: {
      name: 'New York',
      abbreviation: 'NY',
      capital: 'Albany',
      tz: 'Eastern',
      population: 19, // 19.54
      neighbors: ['NJ', 'PN', 'CT', 'MA', 'VA']
    },
    tx: {
      name: 'Texas',
      abbreviation: 'TX',
      capital: 'Austin',
      tz: 'Mountain',
      population: 29, // 19.54
      neighbors: ['NJ', 'PN', 'CT', 'MA', 'VA']
    }
  }

  it('should be able to create a clear request', () => {
    const request = reqFactory.clear()
    assert.equal(request.getCache(), 'States')
    assert.equal(request.getScope(), 'test')
    assert.equal(request instanceof ClearRequest, true)
  })

  it('should be able to create an unsorted IndexRequest', () => {
    const request = reqFactory.addIndex(Extractors.extract('abbreviation'))
    const ue = serializer.deserialize(serializer.serialize(Extractors.extract('abbreviation')))

    assert.equal(request instanceof AddIndexRequest, true)
    assert.equal(request.getCache(), 'States')
    assert.equal(request.getScope(), 'test')
    assert.deepEqual(serializer.deserialize(request.getExtractor()), ue)
    assert.equal(request.getSorted(), false)
    assert.equal(request.getComparator_asU8().length, 0)
  })

  it('should be able to create a sorted IndexRequest', () => {
    const request = reqFactory.addIndex(Extractors.extract('abbreviation'), true, {'@class': 'SimpleComparator'})
    const ue = serializer.deserialize(serializer.serialize(Extractors.extract('abbreviation')))

    assert.equal(request instanceof AddIndexRequest, true)
    assert.equal(request.getCache(), 'States')
    assert.equal(request.getScope(), 'test')
    assert.deepEqual(serializer.deserialize(request.getExtractor()), ue)
    assert.equal(request.getSorted(), true)
    assert.equal(request.getComparator_asU8().length, 30)
    assert.deepEqual(serializer.deserialize(request.getComparator()), {'@class': 'SimpleComparator'})
  })

  it('should be able to create a ContainsEntryRequest', () => {
    const ce = reqFactory.containsEntry('key1', states.ca)

    assert.equal(ce instanceof ContainsEntryRequest, true)
    assert.equal(ce.getCache(), 'States')
    assert.equal(ce.getScope(), 'test')
    assert.equal(serializer.deserialize(ce.getKey()), 'key1')
    assert.deepEqual(serializer.deserialize(ce.getValue()), states.ca)
  })

  it('should be able to create a ContainsKeyRequest', () => {
    const ce = reqFactory.containsKey('key1')

    assert.equal(ce instanceof ContainsKeyRequest, true)
    assert.equal(ce.getCache(), 'States')
    assert.equal(ce.getScope(), 'test')
    assert.equal(serializer.deserialize(ce.getKey()), 'key1')
  })

  it('should be able to create a ContainsValueRequest', () => {
    const ce = reqFactory.containsValue(states.ca)

    assert.equal(ce instanceof ContainsValueRequest, true)
    assert.equal(ce.getCache(), 'States')
    assert.equal(ce.getScope(), 'test')
    assert.deepEqual(serializer.deserialize(ce.getValue()), states.ca)
  })

  it('should be able to create a GetRequest', () => {
    const ce = reqFactory.get('key1')

    assert.equal(ce instanceof GetRequest, true)
    assert.equal(ce.getCache(), 'States')
    assert.equal(ce.getScope(), 'test')
    assert.equal(serializer.deserialize(ce.getKey()), 'key1')
  })

  it('should be able to creat an EntrySetRequest with Filter', () => {
    const filterSer = serializer.deserialize(serializer.serialize(Filters.always()))
    const ce = reqFactory.entrySet(Filters.always())

    assert.equal(ce instanceof EntrySetRequest, true)
    assert.equal(ce.getCache(), 'States')
    assert.equal(ce.getScope(), 'test')
    assert.deepEqual(serializer.deserialize(ce.getFilter()), filterSer)
    assert.equal(ce.getComparator_asU8().length, 0)
  })

  it('should be able to creat an EntrySetRequest with Filter and Comparator', () => {
    const filterSer = serializer.deserialize(serializer.serialize(Filters.always()))
    const ce = reqFactory.entrySet(Filters.always(), {'@class': 'SimpleComparator'})

    assert.equal(ce instanceof EntrySetRequest, true)
    assert.equal(ce.getCache(), 'States')
    assert.equal(ce.getScope(), 'test')
    assert.deepEqual(serializer.deserialize(ce.getFilter()), filterSer)
    assert.equal(ce.getComparator_asU8().length, 30)
    assert.deepEqual(serializer.deserialize(ce.getComparator()), {'@class': 'SimpleComparator'})
  })

  it('should be able to creat a KeySetRequest with Filter', () => {
    const filterSer = serializer.deserialize(serializer.serialize(Filters.always()))
    const ce = reqFactory.keySet(Filters.always())

    assert.equal(ce instanceof KeySetRequest, true)
    assert.equal(ce.getCache(), 'States')
    assert.equal(ce.getScope(), 'test')
    assert.deepEqual(serializer.deserialize(ce.getFilter()), filterSer)
  })

  it('should be able to creat an ValuesRequest with Filter and Comparator', () => {
    const filterSer = serializer.deserialize(serializer.serialize(Filters.always()))
    const ce = reqFactory.values(Filters.always(), {'@class': 'SimpleComparator'})

    assert.equal(ce instanceof ValuesRequest, true)
    assert.equal(ce.getCache(), 'States')
    assert.equal(ce.getScope(), 'test')
    assert.deepEqual(serializer.deserialize(ce.getFilter()), filterSer)
    assert.equal(ce.getComparator_asU8().length, 30)
    assert.deepEqual(serializer.deserialize(ce.getComparator()), {'@class': 'SimpleComparator'})
  })
})

