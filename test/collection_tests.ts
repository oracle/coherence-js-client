// Reference mocha-typescript's global definitions:
/// <reference path='../node_modules/mocha-typescript/globals.d.ts' />


import { expect } from 'chai';
import { Filters } from '../src/filter/filters';
import { Extractors } from '../src/extractor/extractors';
import { AbstractNamedCacheTestsSuite, val123, val234, val345, val456 } from './abstract_named_cache_tests';

@suite(timeout(3000))
class CollectionKeySetSuite
    extends AbstractNamedCacheTestsSuite {

    @test async keySet() {
        expect(await this.cache.size()).to.equal(4);
        const keys = await this.cache.keySet();
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
        const keys = await this.cache.keySet(Filters.equal('str', '234'));
        let count = 0;
        for await (let k of keys) {
            count++;
            expect(k).to.equal('234');
        }
        expect(count).to.equal(1);
    }


    @test async keySetWithEqualsForNumberFilter() {

        const keys = await this.cache.keySet(Filters.greater(Extractors.extract('ival'), 123));
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

        const keys = await this.cache.keySet(Filters.greaterEquals('ival', 234));
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
class CollectionEntrySetSuite
extends AbstractNamedCacheTestsSuite {

    @test async entrySet() {
        const entries = await this.cache.entrySet();
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
        const entries = await this.cache.entrySet(Filters.equal('str', '234'));
        let count = 0;
        for await (let e of entries) {
            count++;
            expect(val234).to.eql(e.getValue());      
        }
        expect(count).to.equal(1);
    }


    @test async entrySetWithEqualsForNumberFilter() {

        const entries = await this.cache.entrySet(Filters.equal('ival', 345));
        let count = 0;
        for await (let e of entries) {
            count++;
            expect(val345).to.eql(e.getValue());      
        }
        expect(count).to.equal(1);
    }

    @test async entrySetWithGreaterFilter() {

        const entries = await this.cache.entrySet(Filters.greaterEquals('ival', 234));
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
class CollectionValuesSuite
extends AbstractNamedCacheTestsSuite {

    @test async values() {
        expect(await this.cache.size()).to.equal(4);
        const values = await this.cache.values();
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
        const values = await this.cache.values(Filters.equal('str', '234'));
        let count = 0;
        for await (let v of values) {
            count++;
            expect(val234).to.eql(v);      
        }
        expect(count).to.equal(1);
    }


    @test async valuesWithEqualsForNumberFilter() {

        const values = await this.cache.values(Filters.equal('ival', 345));
        let count = 0;
        for await (let v of values) {
            count++;
            expect(val345).to.eql(v);      
        }
        expect(count).to.equal(1);
    }

    @test async valuesWithGreaterFilter() {

        const values = await this.cache.values(Filters.greaterEquals('ival', 234));
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

