/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import {expect} from 'chai';
import {suite, test, timeout} from "@testdeck/mocha";

import {Filters} from '../src/filter/filters';
import {Extractors} from '../src/extractor/extractors';
import {NamedCacheClient} from "../src/cache/named_cache_client";
import {SessionBuilder} from '../src/cache/session';

export const session = new SessionBuilder().build();
describe("Collection IT Test Suite", () => {

    let cache: NamedCacheClient;

    const val123 = {id: 123, str: '123', ival: 123, fval: 12.3, iarr: [1, 2, 3]};
    const val234 = {id: 234, str: '234', ival: 234, fval: 23.4, iarr: [2, 3, 4], nullIfOdd: 'non-null'};
    const val345 = {id: 345, str: '345', ival: 345, fval: 34.5, iarr: [3, 4, 5]};
    const val456 = {id: 456, str: '456', ival: 456, fval: 45.6, iarr: [4, 5, 6], nullIfOdd: 'non-null'};

    class CollectionTestSuiteBase {

        public static before() {
            cache = session.getCache('client-cache');
        }

        public async before() {
            await cache.clear();
            await CollectionTestSuiteBase.populateCache(cache);
        }

        public static after() {
            cache.release();
        }

        protected static async populateCache(cache: NamedCacheClient<any, any>) {
            await cache.put("123", val123)
            await cache.put("234", val234)
            await cache.put("345", val345)
            await cache.put("456", val456)
        }

        protected extractKeysAndValues(map: Map<any, any>): { keys: Array<any>, values: Array<any> } {
            const keys = new Array<any>();
            const values = new Array<any>();

            for (let [key, value] of map) {
                keys.push(key);
                values.push(value);
            }
            return { keys, values };
        }

    }

    @suite(timeout(3000))
    class CollectionKeySetSuite
        extends CollectionTestSuiteBase {

        @test async keySet() {
            expect(await cache.size()).to.equal(4);
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
    class CollectionEntrySetSuite
        extends CollectionTestSuiteBase {

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
    class CollectionValuesSuite
        extends CollectionTestSuiteBase {

        @test async values() {
            expect(await cache.size()).to.equal(4);
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

}); 
