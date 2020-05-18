/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

// Reference mocha-typescript's global definitions:
/// <reference path='../node_modules/mocha-typescript/globals.d.ts' />

import { suite, test, slow, timeout } from "mocha-typescript";
import { expect } from 'chai';

import { Extractors } from '../src/extractor/extractors';
import { Filters } from '../src/filter/filters';

import { Processors } from '../src/processor/processors';

import { val123, val234, val345, val456 } from './abstract_named_cache_tests';
import { NamedCacheClient } from "../src/cache/named_cache_client";
import { SessionBuilder } from '../src/cache/session';
import { Aggregators } from "../src/aggregator/aggregators";

export const session = new SessionBuilder().build();
describe("NamedCacheClient IT Test Suite", () => {

    let cache: NamedCacheClient;

    class ClientTestSuiteBase {

        public static async before() {
            cache = session.getCache('client-cache');
            await cache.clear();
            await ClientTestSuiteBase.populateCache(cache);
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

    @suite(timeout(15000))
    class ClearSuite {

        public static async before() {
            cache = session.getCache('clear-cache');
            await cache.clear();
        }

        public static after() {
            cache.release();
        }

        @test async checkEmpty() {
            expect(await cache.isEmpty()).to.equal(true);
        }
        @test async checkSize() {
            expect(await cache.size()).to.equal(0);
        }
        @test async checkGet() {
            expect(await cache.get('123')).to.equal(null);
        }
        @test async checkClear() {
            expect(await cache.isEmpty()).to.equal(true);
        }
        @test async containsKeyOnEmptyMap() {
            expect(await cache.containsKey('123')).to.equal(false);
        }
        @test async containsValueOnEmptyMap() {
            expect(await cache.containsValue(val123)).to.equal(false);
        }
        @test async getOnEmptyMap() {
            expect(await cache.get('123')).to.equal(null);
        }
        @test
        async testOnEmptyMap() {
            const result = await cache.getAll(['123']);
            expect(Array.from(result)).to.have.deep.members([]);
        }
        @test async getOrDefaultOnEmptyMap() {
            const value = { valid: 'yes' };
            expect(await cache.getOrDefault('123abc', value)).to.eql(value);
        }
    }

    describe("NamedCacheClient API Test Suite", () => {

        @suite(timeout(30000))
        class AggregateSuite
            extends ClientTestSuiteBase {

            @test async checkMinAggregator() {
                const result = await cache.aggregate(Aggregators.min('id'));
                expect(result).to.equal(123);
            }
            @test async checkMaxAggregator() {
                const result = await cache.aggregate(Aggregators.max('id'));
                expect(result).to.equal(456);
            }
            @test async checkAvgAggregator() {
                const result = await cache.aggregate(Aggregators.average('id'));
                expect(Number(result)).to.equal(289.5);
            }
        }

        @suite(timeout(3000))
        class AddIndexSuite
            extends ClientTestSuiteBase {

            @test async checkSize() {
                expect(await cache.size()).to.equal(4);
            }
            @test async addIndexOnInt() {
                await cache.addIndex(Extractors.extract('id'));
            }
            @test async addIndexOnStr() {
                await cache.addIndex(Extractors.extract('str'));
            }
            @test async addIndexOnFloatField() {
                await cache.addIndex(Extractors.extract('fval'));
            }
        }

        @suite(timeout(3000))
        class ContainsEntrySuite
            extends ClientTestSuiteBase {

            @test async checkSize() {
                expect(await cache.size()).to.equal(4);
            }

            @test async containsEntryOnEmptyMap() {
                await cache.clear();
                expect(await cache.containsEntry('123', val123))
                    .to.equal(false);
            }

            @test async containsEntryOnExistingMapping() {
                await ClientTestSuiteBase.populateCache(cache);
                expect(await cache.size()).to.equal(4);
                expect(await cache.containsEntry('123', val123)).to.equal(true);
            }

            @test async containsEntryOnNonExistingMapping() {
                expect(await cache.containsEntry('345', { id: 123, str: '123' })).to.equal(false);
            }

            @test async containsEntryWithComplexKey() {
                expect(await cache.containsEntry('345', { id: 123, str: '123' })).to.equal(false);
                await cache.put(val123, val234);
                expect(await cache.containsEntry(val123, val234)).to.equal(true);
            }
        }

        @suite(timeout(3000))
        class ContainsKeySuite
            extends ClientTestSuiteBase {

            @test async containsKeyOnExistingMapping() {
                expect(await cache.containsKey('123')).to.equal(true);
            }

            @test async containsKeyOnNonExistingMapping() {
                expect(await cache.containsKey('34556')).to.equal(false);
            }

            @test async containsKeyWithComplexKey() {
                await cache.put(val123, val234);
                expect(await cache.containsKey(val123)).to.equal(true);
            }
        }

        @suite(timeout(3000))
        class ContainsValueSuite
            extends ClientTestSuiteBase {

            @test async containsValueOnExistingMapping() {
                expect(await cache.containsValue(val123)).to.equal(true);
            }

            @test async containsValueOnNonExistingMapping() {
                expect(await cache.containsValue({ id: 123, name: 'abc' })).to.equal(false);
            }
        }

        @suite(timeout(3000))
        class GetSuite
            extends ClientTestSuiteBase {

            @test async getOnExistingMapping() {
                expect(await cache.get('123')).to.eql(val123);
                expect(await cache.get('456')).to.eql(val456);
            }

            @test async getOnNonExistingMapping() {
                expect(await cache.get({ id: 123, name: 'abc' })).to.equal(null);
                expect(await cache.get('123456')).to.equal(null);
            }
        }

        @suite(timeout(3000))
        class GetAllTestsSuite
            extends ClientTestSuiteBase {

            @test
            async testWithEmptyKeys() {
                expect(await cache.size()).to.equal(4);
                const result = await cache.getAll([]);
                expect(result.size).to.equal(0);
                expect(await cache.size()).to.equal(4);
                expect(Array.from(result)).to.have.deep.members([]);
            }
            @test
            async testWithExistingKeys() {
                expect(await cache.size()).to.equal(4);
                const entries = await cache.getAll(['123', '234', '345']);

                expect(entries.size).to.equal(3);
                expect(Array.from(entries.keys())).to.have.deep.members(['123', '234', '345']);
                expect(Array.from(entries.values())).to.have.deep.members([val123, val234, val345]);
            }
        }


        @suite(timeout(3000))
        class GetOrDefaultSuite
            extends ClientTestSuiteBase {

            dVal: any = { id: 1234, name: '1234' };

            @test async getOrDefaultOnExistingMapping() {
                expect(await cache.getOrDefault('123', this.dVal)).to.eql(val123);
            }

            @test async getOnNonExistingMapping() {
                expect(await cache.getOrDefault({ id: 123, name: 'abc' }, this.dVal)).to.eql(this.dVal);
            }
        }

        @suite(timeout(3000))
        class PutSuite
            extends ClientTestSuiteBase {

            @test async putOnEmptyMap() {
                await cache.clear();
                expect(await cache.put('123', val123)).to.equal(null);
            }

            @test async getOnExistingMapping() {
                expect(await cache.put('123', { id: 123 })).to.eql(val123);
                expect(await cache.get('123')).to.eql({ id: 123 });
                expect(await cache.put('123', val123)).to.eql({ id: 123 });
                expect(await cache.get('123')).to.eql(val123);
            }

            @test async getOnNonExistingMapping() {
                expect(await cache.get('123456')).to.equal(null);
            }
        }


        @suite(timeout(3000))
        class IsEmptySuite
            extends ClientTestSuiteBase {

            @test async checkSizeWhenIsEmptyIsFalse() {
                expect(await cache.size()).to.not.equal(0);
                expect(await cache.isEmpty()).to.equal(false);
            }

            @test async checkSizeAndIsEmptyOnPut() {
                await cache.clear();
                expect(await cache.size()).to.equal(0);
                expect(await cache.isEmpty()).to.equal(true);

                await cache.put(val123, val234);

                expect(await cache.size()).to.not.equal(0);
                expect(await cache.isEmpty()).to.equal(false);
            }
        }


        @suite(timeout(3000))
        class InvokeSuite
            extends ClientTestSuiteBase {

            @test async invokeOnAnExistingKey() {
                expect(await cache.invoke('123', Processors.extract())).to.eql(val123);
            }
            @test async invokeOnANonExistingKey() {
                expect(await cache.invoke('123456', Processors.extract())).to.equal(null);
            }
        }

        @suite(timeout(3000))
        class InvokeAllSuite
            extends ClientTestSuiteBase {

            @test
            async invokeAllWithKeys() {
                const requestKeys: Set<string> = new Set(['123', '234', '345', '456']);
                const result = await cache.invokeAll(requestKeys, Processors.extract());

                let { keys, values } = super.extractKeysAndValues(result);
                expect(Array.from(keys)).to.have.deep.members(['345', '123', '234', '456']);
                expect(Array.from(values)).to.have.deep.members([val123, val234, val345, val456]);
            }
            @test
            async invokeAllWithASubsetOfKeys() {
                const requestKeys: Set<string> = new Set(['234', '345']);
                const result = await cache.invokeAll(requestKeys, Processors.extract());

                let { keys, values } = super.extractKeysAndValues(result);
                expect(Array.from(keys)).to.have.deep.members(Array.from(requestKeys));
                expect(Array.from(values)).to.have.deep.members([val234, val345]);
            }
            @test
            async invokeAllWithEmptyKeys() {
                const requestKeys: Set<string> = new Set([]);
                const result = await cache.invokeAll(requestKeys, Processors.extract());

                let { keys, values } = super.extractKeysAndValues(result);
                expect(Array.from(keys)).to.have.deep.members(['345', '123', '234', '456']);
                expect(Array.from(values)).to.have.deep.members([val123, val234, val345, val456]);
            }
            @test async invokeAllWithAlwaysFilter() {
                const result = await cache.invokeAll(Filters.always(), Processors.extract());

                let { keys, values } = super.extractKeysAndValues(result);

                expect(keys.length).to.equal(4);
                expect(values.length).to.equal(4);

                expect(Array.from(keys)).to.have.deep.members(['123', '234', '345', '456']);
                expect(Array.from(values)).to.have.deep.members([val123, val234, val345, val456]);
            }

        }
    });
});