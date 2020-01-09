// Reference mocha-typescript's global definitions:
/// <reference path='../node_modules/mocha-typescript/globals.d.ts' />


import { expect } from 'chai';

import { AbstractNamedCacheTestsSuite, 
         val123, val234, val345, val456,
         trieObj, jadeObj, javascriptObj
} from './abstract_named_cache_tests';

import { Extractors } from '../src/extractor/extractors';
import { Filters } from '../src/filter/filters';

@suite(timeout(3000))
class ExtractorTestsSuite 
    extends AbstractNamedCacheTestsSuite {

    // ChainedExtractor
    @test
    async testChainedExtractorWithKeySet() {
        const f1 = Filters.equal(Extractors.chained(
            Extractors.extract('t'), Extractors.extract('r'), Extractors.extract('word')), "Trie");
        const entries = await this.nested.entrySet(f1);

        expect(entries.size).to.equal(1);            
        expect(this.entriesToKeys(entries)).to.have.deep.members(['Trie']);
        expect(this.entriesToValues(entries)).to.have.deep.members([trieObj]);       
    }
    @test
    async testChainedExtractorWithEntrySet() {
        const f1 = Filters.equal(Extractors.chained(
            Extractors.extract('j'), Extractors.extract('a'), Extractors.extract('v'), Extractors.extract('word')), "JavaScript");
        const f2= f1.or(Filters.equal(Extractors.chained(
            Extractors.extract('j'), Extractors.extract('a'), Extractors.extract('d'), Extractors.extract('word')), "Jade"));
        const entries = await this.nested.entrySet(f2);

        expect(entries.size).to.equal(2);            
        expect(this.entriesToKeys(entries)).to.have.deep.members(['JavaScript', 'Jade']);
        expect(this.entriesToValues(entries)).to.have.deep.members([javascriptObj, jadeObj]);       
    }
    @test
    async testChainedExtractorWithValues() {
        const f1 = Filters.equal(Extractors.chained(
            Extractors.extract('j'), Extractors.extract('a'), Extractors.extract('v'), Extractors.extract('word')), "JavaScript");
        const f2= f1.or(Filters.equal(Extractors.chained(
            Extractors.extract('j'), Extractors.extract('a'), Extractors.extract('d'), Extractors.extract('word')), "Jade"));
        const values = await this.nested.values(f2);

        expect(values.size).to.equal(2);            
        expect(Array.from(values)).to.have.deep.members([javascriptObj, jadeObj]);       
    }
    @test
    async testChainedExtractorWithFieldNamesWithKeySet() {
        const f1 = Filters.equal(Extractors.chained('t.r.word'), "Trie");
        const entries = await this.nested.entrySet(f1);

        expect(entries.size).to.equal(1);            
        expect(this.entriesToKeys(entries)).to.have.deep.members(['Trie']);
        expect(this.entriesToValues(entries)).to.have.deep.members([trieObj]);       
    }
    @test
    async testChainedExtractorWithFieldNamesWithEntrySet() {
        const f1 = Filters.equal(Extractors.chained('j.a.v.word'), "JavaScript");
        const f2= f1.or(Filters.equal(Extractors.chained('j.a.d.word'), "Jade"));
        const entries = await this.nested.entrySet(f2);

        expect(entries.size).to.equal(2);            
        expect(this.entriesToKeys(entries)).to.have.deep.members(['JavaScript', 'Jade']);
        expect(this.entriesToValues(entries)).to.have.deep.members([javascriptObj, jadeObj]);       
    }
    @test
    async testChainedExtractorWithFieldNamesWithValues() {
        const f1 = Filters.equal(Extractors.chained('j.a.v.word'), "JavaScript");
        const f2= f1.or(Filters.equal(Extractors.chained('j.a.d.word'), "Jade"));
        const values = await this.nested.values(f2);

        expect(values.size).to.equal(2);            
        expect(Array.from(values)).to.have.deep.members([javascriptObj, jadeObj]);       
    }

    // UniversalExtractor
    @test async testUniversalExtractorWithArrayContainsWithKeySet() {
        const f1 = Filters.arrayContains(Extractors.extract('iarr'), 3);
        const keys = await this.cache.keySet(f1);

        expect(keys.size).to.equal(3);
        expect(Array.from(keys)).to.have.deep.members(['123', '234', '345']);
    }
    @test async testUniversalExtractorWithArrayContainsWithEntrySet() {
        const f1 = Filters.arrayContains(Extractors.extract('iarr'), 3);
        const entries = await this.cache.entrySet(f1);

        expect(entries.size).to.equal(3);
        expect(this.entriesToKeys(entries)).to.have.deep.members(['123', '234', '345']);
        expect(this.entriesToValues(entries)).to.have.deep.members([val123, val234, val345]);
    }
    @test async testUniversalExtractorWithArrayContainsWithValues() {
        const f1 = Filters.arrayContains(Extractors.extract('iarr'), 3);
        const entries = await this.cache.values(f1);
        expect(entries.size).to.equal(3);
        expect(Array.from(entries)).to.have.deep.members([val123, val234, val345]);
    }
}