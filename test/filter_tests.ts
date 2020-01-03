// Reference mocha-typescript's global definitions:
/// <reference path='../node_modules/mocha-typescript/globals.d.ts' />

const path = require('path');

import { RequestFactory } from '../src/cache/request_factory';
import { expect } from 'chai';

import { Serializer } from '../src/util/serializer';
import { Extractors } from '../src/extractor/extractors';
import { Filters } from '../src/filter/filters';
import { UniversalExtractor } from '../src/extractor/universal_extractor';
import { states, StateType } from './states';

import { NamedCacheClient } from '../src/cache/named_cache_client'
import { BetweenFilter } from '../src/filter/between_filter';

const reqFactory = new RequestFactory<any, any>("FilterTestsCache");
const cache = new NamedCacheClient<any, any>('FilterTestsCache');

const val123 = {id: 123, str: '123', ival: 123, fval: 12.3, iarr: [1, 2, 3]};
const val234 = {id: 234, str: '234', ival: 234, fval: 23.4, iarr: [2, 3, 4]};
const val345 = {id: 345, str: '345', ival: 345, fval: 34.5, iarr: [3, 4, 5]};
const val456 = {id: 456, str: '456', ival: 456, fval: 45.6, iarr: [4, 5, 6]};

class BaseFilterTestsSuite {
    async before() {
        await cache.clear();
        
        await cache.put("123", val123)
        await cache.put("234", val234)
        await cache.put("345", val345)
        await cache.put("456", val456)
    }
}

@suite(timeout(3000))
class FilterComposition 
    extends BaseFilterTestsSuite {

    @test async withAnd() {
        const f1 = Filters.equal('str', '123');
        const f2 = f1.and(Filters.equal('ival', 123))
        const entries = await cache.entrySet(f2);

        expect(entries.size).to.equal(1);
    }

    @test async withOr() {
        const f1 = Filters.equal('str', '123');
        const f2 = f1.or(Filters.equal('ival', 234))
        const entries = await cache.entrySet(f2);

        expect(entries.size).to.equal(2);
    }

    @test async withXor() {
        const f1 = Filters.equal('str', '123');
        const f2 = f1.xor(Filters.equal('ival', 123))
        const entries = await cache.entrySet(f2);

        expect(entries.size).to.equal(0);
    }
}


@suite(timeout(3000))
class AllFilterSuite 
    extends BaseFilterTestsSuite {

    @test async checkDefaultEntrySet() {
        const f1 = Filters.all(Filters.always(), Filters.never());
        const entries = await cache.entrySet(f1);

        expect(entries.size).to.equal(0);
    }

    @test async checkEntrySetWithFilterAll() {
        const f1 = Filters.all(Filters.equal('str', '123'), Filters.equal('ival', 234));
        const entries = await cache.entrySet(f1);

        expect(entries.size).to.equal(0);
    }

}


@suite(timeout(3000))
class AnyFilterSuite 
    extends BaseFilterTestsSuite {

    @test async checkDefaultEntrySet() {
        const f1 = Filters.any(Filters.never(), Filters.always());
        const entries = await cache.entrySet(f1);

        expect(entries.size).to.equal(4);
    }

    @test async checkEntrySetWithFilterAny() {
        const f1 = Filters.any(Filters.equal('str', '123'), Filters.equal('ival', 234));
        const entries = await cache.entrySet(f1);

        expect(entries.size).to.equal(2);
    }

}

@suite(timeout(3000))
class ArrayContainsFilterSuite 
    extends BaseFilterTestsSuite {

    @test async checkEntrySetWithFilterArrayContains() {
        const f1 = Filters.arrayContains(Extractors.extract('iarr'), 2);
        const entries = await cache.entrySet(f1);

        expect(entries.size).to.equal(2);

        const f2 = Filters.arrayContains(Extractors.extract('iarr'), 3);
        const entries2 = await cache.entrySet(f2);

        expect(entries2.size).to.equal(3);
    }

}


@suite(timeout(3000))
class ArrayContainsAllFilterSuite 
    extends BaseFilterTestsSuite {

    @test 
    async checkEntrySetWithFilterArrayContainsAll() {
        const f1 = Filters.arrayContainsAll(Extractors.extract('iarr'), [1, 2]);
        const entries = await cache.entrySet(f1);
        expect(entries.size).to.equal(1);

        const f2 = Filters.arrayContainsAll(Extractors.extract('iarr'), [3, 4]);
        const entries2 = await cache.entrySet(f2);
        expect(entries2.size).to.equal(2);
    }
    
}

@suite(timeout(3000))
class ArrayContainsAnyFilterSuite 
    extends BaseFilterTestsSuite {

    @test 
    async checkEntrySetWithFilterArrayContainsAny() {
        const f1 = Filters.arrayContainsAny(Extractors.extract('iarr'), [1, 2]);
        const entries = await cache.entrySet(f1);
        expect(entries.size).to.equal(2);

        const f2 = Filters.arrayContainsAny(Extractors.extract('iarr'), [3, 4]);
        const entries2 = await cache.entrySet(f2);
        expect(entries2.size).to.equal(4);
    }
    
}

@suite(timeout(3000))
class BetweenFilterSuite 
    extends BaseFilterTestsSuite {

    @test 
    async checkEntrySetWithBetweenFilter() {
        const f1 = Filters.between(Extractors.extract('ival'), 123, 345);
        const entries = await cache.entrySet(f1);
        expect(entries.size).to.equal(1);

        const f2 = new BetweenFilter(Extractors.extract('ival'), 123, 345, true);
        const entries2 = await cache.entrySet(f2);
        expect(entries2.size).to.equal(2);

        const f3 = new BetweenFilter(Extractors.extract('ival'), 123, 345, true, true);
        const entries3 = await cache.entrySet(f3);
        expect(entries3.size).to.equal(3);
    }
    
}

@suite(timeout(3000))
class ContainsFilterSuite 
    extends BaseFilterTestsSuite {

    @test 
    async checkEntrySetWithContainsFilter() {
        const f1 = Filters.contains(Extractors.extract('iarr'), 2);
        console.log("** [ContainsFilterSuite] Contains filter: " + JSON.stringify(f1));
        const entries = await cache.entrySet(f1);
        expect(entries.size).to.equal(2);

        // const f2 = Filters.contains(Extractors.extract('iarr'), 3);
        // const entries2 = await cache.entrySet(f2);
        // expect(entries2.size).to.equal(2);
    }
    
}


@suite(timeout(3000))
class ContainsAllFilterSuite 
    extends BaseFilterTestsSuite {

    @test 
    async checkEntrySetWithContainsFilter() {
        const f1 = Filters.containsAll(Extractors.extract('iarr'), [2]);
        const entries = await cache.entrySet(f1);
        expect(entries.size).to.equal(2);

        const f2 = Filters.containsAll(Extractors.extract('iarr'), [3, 4]);
        const entries2 = await cache.entrySet(f2);
        expect(entries2.size).to.equal(2);
    }
    
}


@suite(timeout(3000))
class ContainsAnyFilterSuite 
    extends BaseFilterTestsSuite {

    @test 
    async checkEntrySetWithContainsFilter() {
        const f1 = Filters.containsAny(Extractors.extract('iarr'), [1, 2]);
        const entries = await cache.entrySet(f1);
        expect(entries.size).to.equal(2);

        const f2 = Filters.containsAny(Extractors.extract('iarr'), [1, 5]);
        const entries2 = await cache.entrySet(f2);
        expect(entries2.size).to.equal(3);
    }
    
}