/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { suite, test, timeout } from '@testdeck/mocha'
import { RequestFactory } from '../src/cache/request_factory'
import { Extractors } from '../src/extractor/extractors'
import { UniversalExtractor } from '../src/extractor/universal_extractor'
import { Filters } from '../src/filter/filters'

import { SerializerRegistry } from '../src/util/serializer'
import { states, StateType } from './states'

export const assert = require('assert').strict;
const serializer = SerializerRegistry.instance().serializer('json')
const reqFactory = new RequestFactory<string, StateType>('States', serializer)

@suite(timeout(3000))
class RequestStructureSuite {
  @test checkClear () {
    const request = reqFactory.clear()
    assert.equal(request.getCache(), 'States')
  }

  @test addIndexWithExtractor () {
    const request = reqFactory.addIndex(Extractors.extract('abbreviation'))
    const ue = serializer.deserialize(serializer.serialize(new UniversalExtractor('abbreviation')))
    assert.equal(request.getCache(), 'States')
    assert.deepEqual(serializer.deserialize(request.getExtractor()), ue)
    assert.equal(request.getSorted(), false)
    assert.equal(request.getComparator_asU8().length, 0)
  }

  @test addIndexWithExtractorAndSorted () {
    const request = reqFactory.addIndex(Extractors.extract('abbreviation'), true)
    const ue = serializer.deserialize(serializer.serialize(new UniversalExtractor('abbreviation')))
    assert.equal(request.getCache(), 'States')
    assert.deepEqual(serializer.deserialize(request.getExtractor()), ue)
    assert.equal(request.getSorted(), true)
    assert.equal(request.getComparator_asU8().length, 0)
  }

  @test addIndexWithExtractorAndSortedAndComparator () {
    const ue = Extractors.extract('abbreviation')
    const request = reqFactory.addIndex(ue, true, ue)
    const ueSerial = serializer.deserialize(serializer.serialize(ue))
    assert.equal(request.getCache(), 'States')
    assert.deepEqual(serializer.deserialize(request.getExtractor()), ueSerial)
    assert.equal(request.getSorted(), true)
    assert.notEqual(request.getComparator_asU8().length, 0)
  }

  @test containsEntry () {
    const ce = reqFactory.containsEntry('key1', states.ca)
    assert.equal(ce.getCache(), 'States')
    assert.equal(serializer.deserialize(ce.getKey()), 'key1')
    assert.deepEqual(serializer.deserialize(ce.getValue()), states.ca)
  }

  @test containsKey () {
    const ce = reqFactory.containsKey('key1')
    assert.equal(ce.getCache(), 'States')
    assert.equal(serializer.deserialize(ce.getKey()), 'key1')
  }

  @test containsValue () {
    const ce = reqFactory.containsValue(states.ca)
    assert.equal(ce.getCache(), 'States')
    assert.deepEqual(serializer.deserialize(ce.getValue()), states.ca)
  }

  @test getWithStringKey () {
    const ce = reqFactory.get('key1')
    assert.equal(ce.getCache(), 'States')
    assert.equal(serializer.deserialize(ce.getKey()), 'key1')
  }

  @test getWithObjectKey () {
    const factory = new RequestFactory<StateType, StateType>('States', serializer)
    const ce = factory.get(states.ca)
    assert.equal(ce.getCache(), 'States')
    assert.deepEqual(serializer.deserialize(ce.getKey()), states.ca)
  }

  @test entrySetWithFilter () {
    const filterSer = serializer.deserialize(serializer.serialize(Filters.always()))
    const ce = reqFactory.entrySet(Filters.always())
    assert.equal(ce.getCache(), 'States')
    assert.deepEqual(serializer.deserialize(ce.getFilter()), filterSer)
    assert.equal(ce.getComparator_asU8().length, 0)
  }

  @test entrySetWithFilterAndComparator () {
    const filterSer = serializer.deserialize(serializer.serialize(Filters.always()))
    const extractorSer = serializer.deserialize(serializer.serialize(Extractors.extract('abbreviation')))
    const ce = reqFactory.entrySet(Filters.always(), Extractors.extract('abbreviation'))
    assert.equal(ce.getCache(), 'States')
    assert.deepEqual(serializer.deserialize(ce.getFilter()), filterSer)
    assert.notEqual(ce.getComparator_asU8().length, 0)
    assert.deepEqual(serializer.deserialize(ce.getComparator()), extractorSer)
  }

  @test keySetWithFilter () {
    const filterSer = serializer.deserialize(serializer.serialize(Filters.always()))
    const ce = reqFactory.keySet(Filters.always())
    assert.equal(ce.getCache(), 'States')
    assert.deepEqual(serializer.deserialize(ce.getFilter()), filterSer)
  }
}
