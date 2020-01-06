// Reference mocha-typescript's global definitions:
/// <reference path='../node_modules/mocha-typescript/globals.d.ts' />

const path = require('path');

import { RequestFactory } from '../src/cache/request_factory';
import { expect } from 'chai';

import { Filters } from '../src/filter/filters';

import { NamedCacheClient } from '../src/cache/named_cache_client'
import { Util } from '../src/util/util';
import { Serializer } from '../src/util/serializer';
import { Extractors } from '../src/extractor/extractors';

const reqFactory = new RequestFactory<string, any>("States");
const cache = new NamedCacheClient<string, any>('States');

const val123 = {id: 123, str: '123', ival: 123, fval: 12.3};
const val234 = {id: 234, str: '234', ival: 234, fval: 23.4};
const val345 = {id: 345, str: '345', ival: 345, fval: 34.5};
const val456 = {id: 456, str: '456', ival: 456, fval: 45.6};

class BaseCollectionTestsSuite {
    async before() {
        await cache.clear();
        
        await cache.put("123", val123)
        await cache.put("234", val234)
        await cache.put("345", val345)
        await cache.put("456", val456)
    }
}

@suite(timeout(3000))
class KeySetSuite
extends BaseCollectionTestsSuite {

    @test async keySet() {
        const keys = await cache.keySet();
        const expected = new Set<string>();
        expected.add('123').add('234').add('345').add('456');

        let count = 0;
        const set = new Set<string>();

        for await (let k of keys) {            
            count++;
            set.add(k);      
        }
        expect(count).to.equal(4);
        expect(set.size).to.equal(4);
        expect(set).to.eql(expected);
    }

    @test async keySetWithEqualsFilter() {
        const keys = await cache.keySet(Filters.equal('str', '234'));
        let count = 0;
        for await (let k of keys) {
            count++;
            expect(k).to.equal('234');
        }
        expect(count).to.equal(1);
    }


    @test async keySetWithEqualsForNumberFilter() {

        const keys = await cache.keySet(Filters.greater(Extractors.extract('ival'), 123));
        let count = 0;
        const expected = new Set<string>();
        expected.add('234').add('345').add('456');
        const set = new Set<string>();
        
        for await (let k of keys) {
            count++;  
            set.add(k);      
        }

        expect(count).to.equal(3);
        expect(set).to.eql(expected);
    }

    @test async keySetWithGreaterFilter() {

        const keys = await cache.keySet(Filters.greaterEquals('ival', 234));
        let count = 0;
        const expected = new Set<string>();
        expected.add('234').add('345').add('456');
        const set = new Set<string>();

        for await (let k of keys) {
            count++;  
            set.add(k);      
        }

        expect(count).to.equal(3);
        expect(set).to.eql(expected);
    }

}

@suite(timeout(3000))
class EntrySetSuite
extends BaseCollectionTestsSuite {

    @test async entrySet() {
        const entries = await cache.entrySet();
        const expected = new Set();
        expected.add(val123).add(val234).add(val345).add(val456);

        let count = 0;
        const set = new Set();

        for await (let e of entries) {
            count++;
            set.add(e.getValue());      
        }
        expect(count).to.equal(4);
        expect(set.size).to.equal(4);
        // expect(set).to.eql(expected);
    }

    @test async entrySetWithEqualsFilter() {
        const entries = await cache.entrySet(Filters.equal('str', '234'));
        let count = 0;
        for await (let e of entries) {
            count++;
            expect(val234).to.eql(e.getValue());      
        }
        expect(count).to.equal(1);
    }


    @test async entrySetWithEqualsForNumberFilter() {

        const entries = await cache.entrySet(Filters.equal('ival', 345));
        let count = 0;
        for await (let e of entries) {
            count++;
            expect(val345).to.eql(e.getValue());      
        }
        expect(count).to.equal(1);
    }

    @test async entrySetWithGreaterFilter() {

        const entries = await cache.entrySet(Filters.greaterEquals('ival', 234));
        let count = 0;
        const expected = new Set<any>();
        expected.add(val234).add(val345).add(val456);
        const set = new Set<any>();

        for await (let e of entries) {
            count++;  
            set.add(e.getValue());      
        }

        expect(count).to.equal(3);
        expect(set).to.eql(expected);
    }

}

@suite(timeout(3000))
class ValuesSuite
extends BaseCollectionTestsSuite {

    @test async values() {
        const values = await cache.values();
        const expected = new Set();
        expected.add(val123).add(val234).add(val345).add(val456);

        let count = 0;
        const set = new Set();

        for await (let v of values) {
            count++;
            set.add(v);      
        }
        expect(count).to.equal(4);
        expect(set.size).to.equal(4);
        // expect(set).to.eql(expected);
    }

    @test async valuesWithEqualsFilter() {
        const values = await cache.values(Filters.equal('str', '234'));
        let count = 0;
        for await (let v of values) {
            count++;
            expect(val234).to.eql(v);      
        }
        expect(count).to.equal(1);
    }


    @test async valuesWithEqualsForNumberFilter() {

        const values = await cache.values(Filters.equal('ival', 345));
        let count = 0;
        for await (let v of values) {
            count++;
            expect(val345).to.eql(v);      
        }
        expect(count).to.equal(1);
    }

    @test async valuesWithGreaterFilter() {

        const values = await cache.values(Filters.greaterEquals('ival', 234));
        let count = 0;
        const expected = new Set<any>();
        expected.add(val234).add(val345).add(val456);
        const set = new Set<any>();

        for await (let v of values) {
            count++;  
            set.add(v);      
        }

        expect(count).to.equal(3);
        expect(set).to.eql(expected);
    }

}

