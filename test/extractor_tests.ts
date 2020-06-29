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

import {NamedCacheClient} from "../src/cache/named_cache_client";
import {SessionBuilder} from '../src/cache/session';

export const session = new SessionBuilder().build();
describe("Extractor IT Test Suite", () => {

    let nested: NamedCacheClient;

    const val123 = {id: 123, str: '123', ival: 123, fval: 12.3, iarr: [1, 2, 3]};
    const val234 = {id: 234, str: '234', ival: 234, fval: 23.4, iarr: [2, 3, 4], nullIfOdd: 'non-null'};
    const val345 = {id: 345, str: '345', ival: 345, fval: 34.5, iarr: [3, 4, 5]};
    const val456 = {id: 456, str: '456', ival: 456, fval: 45.6, iarr: [4, 5, 6], nullIfOdd: 'non-null'};

    const toObj = { t: { o: { level: 3, word: 'To', tokens: ['t', 'o'] } } };
    const tscObj = { t: { y: { level: 3, word: 'TypeScript', tokens: ['t', 'y'] } } };
    const trieObj = { t: { r: { level: 3, word: 'Trie', tokens: ['t', 'r'] } } };
    const jadeObj = { j: { a: { d: { level: 4, word: 'Jade', tokens: ['j', 'a', 'd'] } } } };
    const javascriptObj = { j: { a: { level: 4, v: { word: 'JavaScript', tokens: ['j', 'a', 'v'] } } } };

    class ExtractorTestSuiteBase {

        public static before() {
            nested = session.getCache('nested-cache');
        }

        public async before() {
            await nested.clear();
            await ExtractorTestSuiteBase.populateCache(nested);
        }

        public static after() {
            nested.release();
        }

        protected toArrayUsing<K>(entries: Set<any>, fn: (e: any) => K): Array<K> {
            let keys: Array<K> = new Array<K>();
            for (let entry of entries) {
                keys.push(fn(entry));
            }
            return keys;
        }

        protected entriesToKeys<K>(entries: Set<any>): Array<K> {
            return this.toArrayUsing(entries, (e) => e.getKey());
        }

        protected entriesToValues<K>(entries: Set<any>): Array<K> {
            return this.toArrayUsing(entries, (e) => e.getValue());
        }

        protected static async populateCache(cache: NamedCacheClient) {
            await nested.put('To', toObj);
            await nested.put('TypeScript', tscObj);
            await nested.put('Trie', trieObj);
            await nested.put('Jade', jadeObj);
            await nested.put('JavaScript', javascriptObj);
        }
    }

    @suite(timeout(3000))
    class ExtractorTestsSuite
        extends ExtractorTestSuiteBase {

        // ChainedExtractor
        @test
        async testChainedExtractorWithKeySet() {
            const f1 = Filters.equal(Extractors.chained(
                Extractors.extract('t'), Extractors.extract('r'), Extractors.extract('word')), "Trie");
            const entries = await nested.entrySet(f1);

            expect(entries.size).to.equal(1);
            expect(this.entriesToKeys(entries)).to.have.deep.members(['Trie']);
            expect(this.entriesToValues(entries)).to.have.deep.members([trieObj]);
        }
        @test
        async testChainedExtractorWithEntrySet() {
            const f1 = Filters.equal(Extractors.chained(
                Extractors.extract('j'), Extractors.extract('a'), Extractors.extract('v'), Extractors.extract('word')), "JavaScript");
            const f2 = f1.or(Filters.equal(Extractors.chained(
                Extractors.extract('j'), Extractors.extract('a'), Extractors.extract('d'), Extractors.extract('word')), "Jade"));
            const entries = await nested.entrySet(f2);

            expect(entries.size).to.equal(2);
            expect(this.entriesToKeys(entries)).to.have.deep.members(['JavaScript', 'Jade']);
            expect(this.entriesToValues(entries)).to.have.deep.members([javascriptObj, jadeObj]);
        }
        @test
        async testChainedExtractorWithValues() {
            const f1 = Filters.equal(Extractors.chained(
                Extractors.extract('j'), Extractors.extract('a'), Extractors.extract('v'), Extractors.extract('word')), "JavaScript");
            const f2 = f1.or(Filters.equal(Extractors.chained(
                Extractors.extract('j'), Extractors.extract('a'), Extractors.extract('d'), Extractors.extract('word')), "Jade"));
            const values = await nested.values(f2);

            expect(values.size).to.equal(2);
            expect(Array.from(values)).to.have.deep.members([javascriptObj, jadeObj]);
        }
        @test
        async testChainedExtractorWithFieldNamesWithKeySet() {
            const f1 = Filters.equal(Extractors.chained('t.r.word'), "Trie");
            const entries = await nested.entrySet(f1);

            expect(entries.size).to.equal(1);
            expect(this.entriesToKeys(entries)).to.have.deep.members(['Trie']);
            expect(this.entriesToValues(entries)).to.have.deep.members([trieObj]);
        }
        @test
        async testChainedExtractorWithFieldNamesWithEntrySet() {
            const f1 = Filters.equal(Extractors.chained('j.a.v.word'), "JavaScript");
            const f2 = f1.or(Filters.equal(Extractors.chained('j.a.d.word'), "Jade"));
            const entries = await nested.entrySet(f2);

            expect(entries.size).to.equal(2);
            expect(this.entriesToKeys(entries)).to.have.deep.members(['JavaScript', 'Jade']);
            expect(this.entriesToValues(entries)).to.have.deep.members([javascriptObj, jadeObj]);
        }
        @test
        async testChainedExtractorWithFieldNamesWithValues() {
            const f1 = Filters.equal(Extractors.chained('j.a.v.word'), "JavaScript");
            const f2 = f1.or(Filters.equal(Extractors.chained('j.a.d.word'), "Jade"));
            const values = await nested.values(f2);

            expect(values.size).to.equal(2);
            expect(Array.from(values)).to.have.deep.members([javascriptObj, jadeObj]);
        }

    }


    @suite(timeout(3000))
    class UniversalExtractorSuite
        extends ExtractorTestSuiteBase {

        static cache: NamedCacheClient;

        public static async before() {
            const cache = session.getCache('univ-cache');
            UniversalExtractorSuite.cache = cache;

            await cache.put("123", val123)
            await cache.put("234", val234)
            await cache.put("345", val345)
            await cache.put("456", val456)
        }

        public static after() {
            UniversalExtractorSuite.cache.release();
        }

        // UniversalExtractor
        @test async testUniversalExtractorWithArrayContainsWithKeySet() {
            const f1 = Filters.arrayContains(Extractors.extract('iarr'), 3);
            const keys = await UniversalExtractorSuite.cache.keySet(f1);

            expect(keys.size).to.equal(3);
            expect(Array.from(keys)).to.have.deep.members(['123', '234', '345']);
        }

        @test async testUniversalExtractorWithArrayContainsWithEntrySet() {
            const f1 = Filters.arrayContains(Extractors.extract('iarr'), 3);
            const entries = await UniversalExtractorSuite.cache.entrySet(f1);

            expect(entries.size).to.equal(3);
            expect(this.entriesToKeys(entries)).to.have.deep.members(['123', '234', '345']);
            expect(this.entriesToValues(entries)).to.have.deep.members([val123, val234, val345]);
        }

        @test async testUniversalExtractorWithArrayContainsWithValues() {
            const f1 = Filters.arrayContains(Extractors.extract('iarr'), 3);
            const entries = await UniversalExtractorSuite.cache.values(f1);
            expect(entries.size).to.equal(3);
            expect(Array.from(entries)).to.have.deep.members([val123, val234, val345]);
        }
    }

});