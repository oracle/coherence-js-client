/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import {RequestFactory} from '../src/cache/request_factory';
import {expect} from 'chai';
import {suite, test, timeout} from "@testdeck/mocha";

import {SerializerRegistry} from '../src/util/serializer';
import {Extractors} from '../src/extractor/extractors';
import {Filters} from '../src/filter/filters';
import {UniversalExtractor} from '../src/extractor/universal_extractor';
import {states, StateType} from './states';

const serializer = SerializerRegistry.instance().serializer('json');
const reqFactory = new RequestFactory<string, StateType>("States", serializer);


@suite(timeout(3000))
class RequestStructureSuite {

    @test checkClear() {
        const request = reqFactory.clear();
        expect(request.getCache()).to.equal("States");
    }

    @test addIndexWithExtractor() {
        const request = reqFactory.addIndex(Extractors.extract('abbreviation'));
        const ue = new UniversalExtractor('abbreviation');
        expect(request.getCache()).to.equal("States");
        expect(serializer.deserialize(request.getExtractor())).to.eql(ue);
        expect(request.getSorted()).to.equal(false);
        const compLen = request.getComparator_asU8().length
        expect(request.getComparator_asU8().length).to.equal(0);
    }

    @test addIndexWithExtractorAndSorted() {
        const request = reqFactory.addIndex(Extractors.extract('abbreviation'), true);
        const ue = new UniversalExtractor('abbreviation');
        expect(request.getCache()).to.equal("States");
        expect(serializer.deserialize(request.getExtractor())).to.eql(ue);
        expect(request.getSorted()).to.equal(true);
        expect(request.getComparator_asU8().length).to.equal(0);
    }

    @test addIndexWithExtractorAndSortedAndComparator() {
        const ue = Extractors.extract('abbreviation');
        const request = reqFactory.addIndex(ue, true, ue);
        expect(request.getCache()).to.equal("States");
        expect(serializer.deserialize(request.getExtractor())).to.eql(ue);
        expect(request.getSorted()).to.equal(true);
        expect(request.getComparator_asU8().length).to.not.equal(0);
    }

    @test containsEntry() {
        const ce = reqFactory.containsEntry("key1", states.ca);
        expect(ce.getCache()).to.equal("States");
        expect(serializer.deserialize(ce.getKey())).to.equal("key1");
        expect(serializer.deserialize(ce.getValue())).to.eql(states.ca);
    }

    @test containsKey() {
        const ce = reqFactory.containsKey("key1");
        expect(ce.getCache()).to.equal("States");
        expect(serializer.deserialize(ce.getKey())).to.equal("key1");
    }

    @test containsValue() {
        const ce = reqFactory.containsValue(states.ca);
        expect(ce.getCache()).to.equal("States");
        expect(serializer.deserialize(ce.getValue())).to.eql(states.ca);
    }

    @test getWithStringKey() {
        const ce = reqFactory.get("key1");
        expect(ce.getCache()).to.equal("States");
        expect(serializer.deserialize(ce.getKey())).to.equal("key1");
    }

    @test getWithObjectKey() {
        const factory = new RequestFactory<StateType, StateType>('States', serializer);
        const ce = factory.get(states.ca);
        expect(ce.getCache()).to.equal("States");
        expect(serializer.deserialize(ce.getKey())).to.eql(states.ca);
    }

    @test entrySetWithFilter() {
        const ce = reqFactory.entrySet(Filters.always());
        expect(ce.getCache()).to.equal("States");
        expect(serializer.deserialize(ce.getFilter())).to.eql(Filters.always());
        expect(ce.getComparator_asU8().length).to.equal(0);
    }

    @test entrySetWithFilterAndComparator() {
        const ce = reqFactory.entrySet(Filters.always(), Extractors.extract('abbreviation'));
        expect(ce.getCache()).to.equal("States");
        expect(serializer.deserialize(ce.getFilter())).to.eql(Filters.always());
        expect(ce.getComparator_asU8().length).not.to.equal(0);
        expect(serializer.deserialize(ce.getComparator())).to.eql(Extractors.extract('abbreviation'));
    }

    @test keySetWithFilter() {
        const ce = reqFactory.keySet(Filters.always());
        expect(ce.getCache()).to.equal("States");
        expect(serializer.deserialize(ce.getFilter())).to.eql(Filters.always());
    }
}

