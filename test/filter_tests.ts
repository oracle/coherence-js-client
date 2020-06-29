/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */


import {expect} from 'chai';
import {suite, test, timeout} from "@testdeck/mocha";

import {Extractors} from '../src/extractor/extractors';
import {Filters} from '../src/filter/filters';
import {BetweenFilter} from '../src/filter/between_filter';

import {TestUtil, val123, val234, val345, val456,} from './abstract_named_cache_tests';

import {NamedCacheClient} from "../src/cache/named_cache_client";
import {SessionBuilder} from '../src/cache/session';

export const session = new SessionBuilder().build();

describe("Filter IT Test Suite", () => {

    let cache: NamedCacheClient;

    @suite(timeout(3000))
    class FilterTestsSuite {

        public static async before() {
            cache = session.getCache('filter-cache');
            await cache.clear();
            await TestUtil.populateCache(cache);
        }

        public static after() {
            cache.release();
        }

        @test async composeFilterWithAnd() {
            const f1 = Filters.equal('str', '123');
            const f2 = f1.and(Filters.equal('ival', 123))
            const entries = await cache.entrySet(f2);

            let values = TestUtil.entriesToValues(entries);
            expect(values.length).to.equal(1);
            expect(values[0]).to.eql(val123);
        }

        @test async composeFilterWithOr() {
            const f1 = Filters.equal('str', '123');
            const f2 = f1.or(Filters.equal('ival', 234))

            let values = Array.from(await cache.values(f2))
            expect(values.length).to.equal(2);
            expect(values).to.have.deep.members([val123, val234]);
        }

        @test async composeFilterWithXor() {
            const f1 = Filters.equal('str', '123');
            const f2 = f1.xor(Filters.equal('ival', 123))
            const entries = await cache.entrySet(f2);

            expect(entries.size).to.equal(0);
        }

        @test async testEntrySetWithAllFilterWithNoResult() {
            const f1 = Filters.all(Filters.always(), Filters.never());
            const entries = await cache.entrySet(f1);

            expect(entries.size).to.equal(0);
        }

        // AllFilter
        @test async testAllFilterWithKeySet() {
            const f1 = Filters.all(Filters.equal('str', '123'), Filters.equal('ival', 234));
            expect(Array.from(await cache.keySet(f1)).length).to.equal(0);
        }
        @test async testAllFilterWithEntrySet() {
            const f1 = Filters.all(Filters.equal('str', '123'), Filters.equal('ival', 234));
            expect(Array.from(await cache.entrySet(f1)).length).to.equal(0);
        }
        @test async testAllFilterWithValues() {
            const f1 = Filters.all(Filters.equal('str', '123'), Filters.equal('ival', 234));
            expect(Array.from(await cache.values(f1)).length).to.equal(0);
        }

        // AnyFilter
        @test async testAnyFilterWithKeySet() {
            const f1 = Filters.any(Filters.equal('str', '123'), Filters.equal('ival', 456));
            const keys = await cache.keySet(f1);

            expect(keys.size).to.equal(2);
            expect(Array.from(keys)).to.have.deep.members(['123', '456']);
        }
        @test async testAnyFilterWithEntrySet() {
            const f1 = Filters.any(Filters.equal('str', '123'), Filters.equal('ival', 456));
            const entries = await cache.entrySet(f1);

            expect(TestUtil.entriesToKeys(entries)).to.have.deep.members(['123', '456']);
            expect(TestUtil.entriesToValues(entries)).to.have.deep.members([val123, val456]);
        }
        @test async testAnyFilterWithValues() {
            const f1 = Filters.any(Filters.equal('str', '123'), Filters.equal('ival', 456));
            const values = await cache.values(f1);

            expect(Array.from(values)).to.have.deep.members([val123, val456]);
        }

        // ArrayContains
        @test async testArrayContainsWithKeySet() {
            const f1 = Filters.arrayContains(Extractors.extract('iarr'), 3);
            const keys = await cache.keySet(f1);

            expect(keys.size).to.equal(3);
            expect(Array.from(keys)).to.have.deep.members(['123', '234', '345']);
        }
        @test async testArrayContainsWithEntrySet() {
            const f1 = Filters.arrayContains(Extractors.extract('iarr'), 3);
            const entries = await cache.entrySet(f1);

            expect(entries.size).to.equal(3);
            expect(TestUtil.entriesToKeys(entries)).to.have.deep.members(['123', '234', '345']);
            expect(TestUtil.entriesToValues(entries)).to.have.deep.members([val123, val234, val345]);
        }
        @test async testArrayContainsWithValues() {
            const f1 = Filters.arrayContains(Extractors.extract('iarr'), 3);
            const entries = await cache.values(f1);
            expect(entries.size).to.equal(3);
            expect(Array.from(entries)).to.have.deep.members([val123, val234, val345]);
        }

        // ArrayContainsAll
        @test
        async testArrayContainsAllWithKeySet() {
            const f1 = Filters.arrayContainsAll(Extractors.extract('iarr'), [1, 2]);
            const keys = await cache.keySet(f1);
            expect(keys.size).to.equal(1);
            expect(Array.from(keys)[0]).to.equal('123');
        }
        @test
        async testArrayContainsAllWithEntrySet() {
            const f1 = Filters.arrayContainsAll(Extractors.extract('iarr'), [1, 2]);
            const entries = await cache.entrySet(f1);

            expect(entries.size).to.equal(1);
            expect(TestUtil.entriesToKeys(entries)).to.have.deep.members(['123']);
            expect(TestUtil.entriesToValues(entries)).to.have.deep.members([val123]);
        }
        @test
        async testArrayContainsAllWithValues() {
            const f1 = Filters.arrayContainsAll(Extractors.extract('iarr'), [1, 2]);
            const values = await cache.values(f1);
            expect(values.size).to.equal(1);
            expect(Array.from(values)[0]).to.eql(val123);
        }

        // ArrayContainsAny
        @test
        async testArrayContainsAnyWithKeySet() {
            const f1 = Filters.arrayContainsAny(Extractors.extract('iarr'), [1, 2]);
            const keys = await cache.keySet(f1);
            expect(keys.size).to.equal(2);
            expect(Array.from(keys)).to.have.deep.members(['123', '234']);
        }
        @test
        async testArrayContainsAnyWithEntrySet() {
            const f1 = Filters.arrayContainsAny(Extractors.extract('iarr'), [1, 2]);
            const entries = await cache.entrySet(f1);
            expect(entries.size).to.equal(2);
            expect(TestUtil.entriesToKeys(entries)).to.have.deep.members(['123', '234']);
            expect(TestUtil.entriesToValues(entries)).to.have.deep.members([val123, val234]);
        }
        @test
        async testArrayContainsAnyWithValues() {
            const f1 = Filters.arrayContainsAny(Extractors.extract('iarr'), [1, 2]);
            const values = await cache.entrySet(f1);
            expect(values.size).to.equal(2);
            expect(TestUtil.entriesToValues(values)).to.have.deep.members([val123, val234]);
        }

        // BetweenFilter
        @test
        async testBetweenWithKeySet() {
            const f1 = Filters.between(Extractors.extract('ival'), 123, 345);
            const entries = await cache.keySet(f1);

            expect(entries.size).to.equal(1);
            expect(Array.from(entries)[0]).to.equal('234');
        }
        async testBetweenWithEntrySet() {
            const f1 = Filters.between(Extractors.extract('ival'), 123, 345);
            const entries = await cache.entrySet(f1);

            expect(entries.size).to.equal(1);
            expect(Array.from(entries)[0].getKey()).to.equal('234');
            expect(Array.from(entries)[0].getValue()).to.eql(val234);
        }
        async testBetweenWithValues() {
            const f1 = Filters.between(Extractors.extract('ival'), 123, 345);
            const entries = await cache.values(f1);

            expect(entries.size).to.equal(1);
            expect(Array.from(entries)[0]).to.eql(val234);
        }
        // BetweenFilter with lower bound
        @test
        async testBetweenFilterWithLowerBoundWithKeySet() {
            const f2 = new BetweenFilter(Extractors.extract('ival'), 123, 345, true);
            const keys = await cache.keySet(f2);

            expect(keys.size).to.equal(2);
            expect(Array.from(keys)).to.have.deep.members(['123', '234']);
        }
        async testBetweenFilterWithLowerBoundWithEntrySet() {
            const f2 = new BetweenFilter(Extractors.extract('ival'), 123, 345, true);
            const entries = await cache.entrySet(f2);

            expect(entries.size).to.equal(2);
            expect(TestUtil.entriesToKeys(entries)).to.have.deep.members(['123', '234']);
            expect(TestUtil.entriesToValues(entries)).to.have.deep.members([val123, val234]);
        }
        async testBetweenFilterWithLowerBoundWithValues() {
            const f2 = new BetweenFilter(Extractors.extract('ival'), 123, 345, true);
            const values = await cache.values(f2);

            expect(values.size).to.equal(2);
            expect(TestUtil.entriesToValues(values)).to.have.deep.members([val123, val234]);
        }
        // BetweenFilter with lower and upper bound
        @test
        async testBetweenFilterWithLowerBoundAndUpperBoundWithKeySet() {
            const f2 = new BetweenFilter(Extractors.extract('ival'), 123, 345, true, true);
            const keys = await cache.keySet(f2);

            expect(keys.size).to.equal(3);
            expect(Array.from(keys)).to.have.deep.members(['123', '234', '345']);
        }
        async testBetweenFilterWithLowerBoundAndUpperBoundWithEntrySet() {
            const f2 = new BetweenFilter(Extractors.extract('ival'), 123, 345, true, true);
            const entries = await cache.entrySet(f2);

            expect(entries.size).to.equal(3);
            expect(TestUtil.entriesToKeys(entries)).to.have.deep.members(['123', '234', '345']);
            expect(TestUtil.entriesToValues(entries)).to.have.deep.members([val123, val234, val345]);
        }
        async testBetweenFilterWithLowerBoundAndUpperBoundWithValues() {
            const f2 = new BetweenFilter(Extractors.extract('ival'), 123, 345, true, true);
            const values = await cache.values(f2);

            expect(values.size).to.equal(3);
            expect(TestUtil.entriesToValues(values)).to.have.deep.members([val123, val234, val345]);
        }

        // ContainsFilter
        @test
        async testContainsWithKeySet() {
            const f1 = Filters.contains(Extractors.extract('iarr'), 3);
            const keys = await cache.keySet(f1);

            expect(keys.size).to.equal(3);
            expect(Array.from(keys)).to.have.deep.members(['123', '234', '345']);
        }
        @test
        async testContainsWithEntrySet() {
            const f2 = Filters.contains(Extractors.extract('iarr'), 3);
            const entries = await cache.entrySet(f2);

            expect(entries.size).to.equal(3);
            expect(TestUtil.entriesToKeys(entries)).to.have.deep.members(['123', '234', '345']);
            expect(TestUtil.entriesToValues(entries)).to.have.deep.members([val123, val234, val345]);
        }
        @test
        async testContainsWithValues() {
            const f2 = Filters.contains(Extractors.extract('iarr'), 3);
            const values = await cache.values(f2);

            expect(values.size).to.equal(3);
            expect(Array.from(values)).to.have.deep.members([val123, val234, val345]);
        }

        // ContainsAllFilter
        @test
        async testContainsAllWithKeySet() {
            const f2 = Filters.containsAll(Extractors.extract('iarr'), [3, 4]);
            const keys = await cache.keySet(f2);

            expect(keys.size).to.equal(2);
            expect(Array.from(keys)).to.have.deep.members(['234', '345']);
        }
        @test
        async testContainsAllWithEntrySet() {
            const f2 = Filters.containsAll(Extractors.extract('iarr'), [3, 4]);
            const entries = await cache.entrySet(f2);

            expect(entries.size).to.equal(2);
            expect(TestUtil.entriesToKeys(entries)).to.have.deep.members(['234', '345']);
            expect(TestUtil.entriesToValues(entries)).to.have.deep.members([val234, val345]);
        }
        @test
        async testContainsAllWithValues() {
            const f2 = Filters.containsAll(Extractors.extract('iarr'), [3, 4]);
            const values = await cache.values(f2);

            expect(values.size).to.equal(2);
            expect(Array.from(values)).to.have.deep.members([val234, val345]);
        }
        @test
        async testContainsAllWithEmptyResult() {
            const f2 = Filters.containsAll(Extractors.extract('iarr'), [3, 4, 34]);
            const entries2 = await cache.entrySet(f2);
            expect(entries2.size).to.equal(0);
        }

        // ContainsAny
        @test
        async testContainsAnyWithKeySet() {
            const f2 = Filters.containsAny(Extractors.extract('iarr'), [3, 4]);
            const keys = await cache.keySet(f2);

            expect(keys.size).to.equal(4);
            expect(Array.from(keys)).to.have.deep.members(['123', '234', '345', '456']);
        }
        @test
        async testContainsAnyWithEntrySet() {
            const f2 = Filters.containsAny(Extractors.extract('iarr'), [3, 4]);
            const entries = await cache.entrySet(f2);

            expect(entries.size).to.equal(4);
            expect(TestUtil.entriesToKeys(entries)).to.have.deep.members(['123', '234', '345', '456']);
            expect(TestUtil.entriesToValues(entries)).to.have.deep.members([val123, val234, val345, val456]);

        }
        @test
        async testContainsAnyWithValues() {
            const f2 = Filters.containsAny(Extractors.extract('iarr'), [3, 4]);
            const values = await cache.values(f2);

            expect(values.size).to.equal(4);
            expect(Array.from(values)).to.have.deep.members([val123, val234, val345, val456]);
        }
        @test
        async testContainsAnyWithEmptyResult() {
            const f2 = Filters.containsAny(Extractors.extract('iarr'), [15, 59, 358]);
            const entries2 = await cache.entrySet(f2);
            expect(entries2.size).to.equal(0);
        }
        @test
        async testContainsAnyWithEmptyCollection() {
            const f2 = Filters.containsAny(Extractors.extract('iarr'), []);
            const entries2 = await cache.entrySet(f2);
            expect(entries2.size).to.equal(0);
        }

        // Equal
        @test
        async testEqualsFilterWithKeySet() {
            const f1 = Filters.equal(Extractors.extract('ival'), 234)
                .or(Filters.equal(Extractors.extract('ival'), 345));
            const keys = await cache.keySet(f1);
            expect(keys.size).to.equal(2);
            expect(Array.from(keys)).to.have.deep.members(['234', '345']);
        }
        async testEqualsFilterWithEntrySet() {
            const f1 = Filters.equal(Extractors.extract('ival'), 234)
                .or(Filters.equal(Extractors.extract('ival'), 345));
            const entries = await cache.entrySet(f1);
            expect(entries.size).to.equal(2);
            expect(TestUtil.entriesToKeys(entries)).to.have.deep.members(['234', '345']);
            expect(TestUtil.entriesToValues(entries)).to.have.deep.members([val234, val345]);
        }
        async testEqualsFilterWithValues() {
            const f1 = Filters.equal(Extractors.extract('ival'), 234)
                .or(Filters.equal(Extractors.extract('ival'), 345));
            const values = await cache.keySet(f1);
            expect(values.size).to.equal(1);
            expect(Array.from(values)).to.have.deep.members([val234, val345]);
        }
        @test
        async testEqualsFilterWithFieldName() {
            const f1 = Filters.equal('ival', 123).or(Filters.equal('ival', 234));
            const entries = await cache.entrySet(f1);
            expect(entries.size).to.equal(2);
            expect(TestUtil.entriesToKeys(entries)).to.have.deep.members(['123', '234']);
            expect(TestUtil.entriesToValues(entries)).to.have.deep.members([val123, val234]);
        }

        // GreaterFilter
        @test
        async testGreaterFilterWithKeySet() {
            const f1 = Filters.greater('ival', 123).and(
                Filters.greater(Extractors.extract('ival'), 234)
            );
            const keys = await cache.keySet(f1);
            expect(keys.size).to.equal(2);
            expect(Array.from(keys)).to.have.deep.members(['345', '456']);
        }
        @test
        async testGreaterFilterWithEntrySet() {
            const f1 = Filters.greater('ival', 123).and(
                Filters.greater(Extractors.extract('ival'), 234)
            );
            const entries = await cache.entrySet(f1);
            expect(entries.size).to.equal(2);
            expect(TestUtil.entriesToKeys(entries)).to.have.deep.members(['345', '456']);
            expect(TestUtil.entriesToValues(entries)).to.have.deep.members([val345, val456]);
        }
        @test
        async testGreaterFilterWithValues() {
            const f1 = Filters.greater('ival', 123).and(
                Filters.greater(Extractors.extract('ival'), 234)
            );
            const values = await cache.values(f1);
            expect(values.size).to.equal(2);
            expect(Array.from(values)).to.have.deep.members([val345, val456]);
        }
        @test
        async testGreaterFilterWithFieldName() {
            const f1 = Filters.greater('ival', 123);
            const entries2 = await cache.entrySet(f1);
            expect(entries2.size).to.equal(3);
        }
        @test
        async testGreaterFilterWithComposition() {
            const f1 = Filters.greater('ival', 123).or(
                Filters.greater(Extractors.extract('ival'), 345)
            );
            const entries = await cache.entrySet(f1);
            expect(entries.size).to.equal(3);
            expect(TestUtil.entriesToKeys(entries)).to.have.deep.members(['234', '345', '456']);
            expect(TestUtil.entriesToValues(entries)).to.have.deep.members([val234, val345, val456]);
        }

        // GreaterEqualsFilter
        @test
        async testGreaterEqualsFilterWithKeySet() {
            const f1 = Filters.greaterEqual('ival', 234).and(
                Filters.greaterEqual(Extractors.extract('ival'), 345)
            );
            const keys = await cache.keySet(f1);
            expect(keys.size).to.equal(2);
            expect(Array.from(keys)).to.have.deep.members(['345', '456']);
        }
        @test
        async testGreaterEqualsFilterWithEntrySet() {
            const f1 = Filters.greaterEqual('ival', 234).and(
                Filters.greaterEqual(Extractors.extract('ival'), 345)
            );
            const entries = await cache.entrySet(f1);
            expect(entries.size).to.equal(2);
            expect(TestUtil.entriesToKeys(entries)).to.have.deep.members(['345', '456']);
            expect(TestUtil.entriesToValues(entries)).to.have.deep.members([val345, val456]);
        }
        @test
        async testGreaterEqualsFilterWithValues() {
            const f1 = Filters.greaterEqual('ival', 234).and(
                Filters.greaterEqual(Extractors.extract('ival'), 345)
            );
            const values = await cache.values(f1);
            expect(values.size).to.equal(2);
            expect(Array.from(values)).to.have.deep.members([val345, val456]);
        }

        // In

        @test
        async testInFilterWithKeySet() {
            const f1 = Filters.in(Extractors.extract('ival'), [345, 456]);
            const keys = await cache.keySet(f1);
            expect(keys.size).to.equal(2);
            expect(Array.from(keys)).to.have.deep.members(['345', '456']);
        }
        @test
        async testInFilterWithEntrySet() {
            const f1 = Filters.in(Extractors.extract('ival'), [123, 234]).or(Filters.equal('ival', 345));

            const entries = await cache.entrySet(f1);
            expect(entries.size).to.equal(3);
            expect(TestUtil.entriesToKeys(entries)).to.have.deep.members(['123', '234', '345']);
            expect(TestUtil.entriesToValues(entries)).to.have.deep.members([val123, val234, val345]);
        }
        @test
        async testInFilterWithValues() {
            const f1 = Filters.in(Extractors.extract('ival'), [123234]);
            const values = await cache.values(f1);
            expect(values.size).to.equal(0);
        }

        // Not
        @test
        async testNotFilter() {
            const f1 = Filters.not(
                Filters.equal(Extractors.extract('ival'), 234)
            );
            const entries2 = await cache.entrySet(f1);
            expect(entries2.size).to.equal(3);
        }
        @test
        async testNotWithFieldName() {
            const f1 = Filters.not(Filters.equal('ival', 123));
            const entries2 = await cache.entrySet(f1);
            expect(entries2.size).to.equal(3);
        }
        @test
        async testNotWithComposition() {
            const f1 = Filters.not(Filters.equal('ival', 123).or(
                Filters.equal(Extractors.extract('ival'), 234))
            );
            const entries2 = await cache.entrySet(f1);
            expect(entries2.size).to.equal(2);
        }

        // Null 
        @test
        async testIsNullFilterWithKeySet() {
            const f1 = Filters.isNull(Extractors.extract('nullIfOdd'));
            const keys = await cache.keySet(f1);
            expect(keys.size).to.equal(2);
            expect(Array.from(keys)).to.have.deep.members(['123', '345']);
        }
        @test
        async testIsNullFilterWithEntrySet() {
            const f1 = Filters.isNull(Extractors.extract('nullIfOdd'));
            const entries = await cache.entrySet(f1);
            expect(entries.size).to.equal(2);
            expect(TestUtil.entriesToKeys(entries)).to.have.deep.members(['123', '345']);
            expect(TestUtil.entriesToValues(entries)).to.have.deep.members([val123, val345]);
        }
        @test
        async testIsNullFilterWithValues() {
            const f1 = Filters.isNull(Extractors.extract('nullIfOdd'));
            const values = await cache.values(f1);
            expect(values.size).to.equal(2);
            expect(Array.from(values)).to.have.deep.members([val123, val345]);
        }

        // NotNull 
        @test
        async testIsNotNullFilterWithKeySet() {
            const f1 = Filters.isNotNull(Extractors.extract('nullIfOdd'));
            const keys = await cache.keySet(f1);
            expect(keys.size).to.equal(2);
            expect(Array.from(keys)).to.have.deep.members(['234', '456']);
        }
        @test
        async testIsNotNullFilterWithEntrySet() {
            const f1 = Filters.isNotNull(Extractors.extract('nullIfOdd'));
            const entries = await cache.entrySet(f1);
            expect(entries.size).to.equal(2);
            expect(TestUtil.entriesToKeys(entries)).to.have.deep.members(['234', '456']);
            expect(TestUtil.entriesToValues(entries)).to.have.deep.members([val234, val456]);
        }
        @test
        async testIsNotNullFilterWithValues() {
            const f1 = Filters.isNotNull(Extractors.extract('nullIfOdd'));
            const values = await cache.values(f1);
            expect(values.size).to.equal(2);
            expect(Array.from(values)).to.have.deep.members([val234, val456]);
        }
    }

});