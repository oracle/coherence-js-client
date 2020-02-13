// Reference mocha-typescript's global definitions:
/// <reference path='../node_modules/mocha-typescript/globals.d.ts' />

import { RequestFactory } from '../src/cache/request_factory';
import { expect } from 'chai';

import { Extractors } from '../src/extractor/extractors';
import { Filters } from '../src/filter/filters';

import { NamedCacheClient } from '../src/cache/named_cache_client'
import { Processors } from '../src/processor/processors';
import { AbstractNamedCacheTestsSuite } from './abstract_named_cache_tests';
import { Serializer } from '../src/util/serializer';

import {val123, val234, val345, val456 } from './abstract_named_cache_tests';
import { Suite } from 'mocha';


@suite(timeout(15000))
class ClearSuite 
    extends AbstractNamedCacheTestsSuite {

    async before() {
        await AbstractNamedCacheTestsSuite.cache.clear();
        await AbstractNamedCacheTestsSuite.nested.clear();
    }

    @test async checkEmpty() {
        expect(await AbstractNamedCacheTestsSuite.cache.isEmpty()).to.equal(true);
    }
    @test async checkSize() {
        expect(await AbstractNamedCacheTestsSuite.cache.size()).to.equal(0);
    }    
    @test async checkGet() {
        expect(await AbstractNamedCacheTestsSuite.cache.get('123')).to.equal(null); 
    }  
    @test async checkClear() {
        await AbstractNamedCacheTestsSuite.cache.clear(); 
        expect(await AbstractNamedCacheTestsSuite.cache.isEmpty()).to.equal(true);
    }
}

@suite(timeout(3000))
class AddIndexSuite 
    extends AbstractNamedCacheTestsSuite {

    @test async checkSize() {
        expect(await AbstractNamedCacheTestsSuite.cache.size()).to.equal(4);
    }
    @test async addIndexOnInt() {
        await AbstractNamedCacheTestsSuite.cache.addIndex(Extractors.extract('id'));
    }
    @test async addIndexOnStr() {
        await AbstractNamedCacheTestsSuite.cache.addIndex(Extractors.extract('str'));
    }
    @test async addIndexOnFloatField() {
        await AbstractNamedCacheTestsSuite.cache.addIndex(Extractors.extract('fval'));
    }
}

@suite(timeout(3000))
class ContainsEntrySuite 
    extends AbstractNamedCacheTestsSuite {

    @test async checkSize() {
        expect(await AbstractNamedCacheTestsSuite.cache.size()).to.equal(4);
    }
    
    @test async containsEntryOnEmptyMap() {
        await AbstractNamedCacheTestsSuite.cache.clear();
        expect(await AbstractNamedCacheTestsSuite.cache.containsEntry('123', val123))
        .to.equal(false);
    }

    @test async containsEntryOnExistingMapping() {
        expect(await AbstractNamedCacheTestsSuite.cache.size()).to.equal(4);
        expect(await AbstractNamedCacheTestsSuite.cache.containsEntry('123', val123)).to.equal(true);
    }

    @test async containsEntryOnNonExistingMapping() {
        expect(await AbstractNamedCacheTestsSuite.cache.containsEntry('345', {id: 123, str: '123'})).to.equal(false);    
    }

    @test async containsEntryWithComplexKey() {
        const cache2 = AbstractNamedCacheTestsSuite.session.getCache<any, any>('States');
        await cache2.put(val123, val234);
        expect(await cache2.containsEntry(val123, val234)).to.equal(true);    
    }
}

@suite(timeout(3000))
class ContainsKeySuite 
    extends AbstractNamedCacheTestsSuite {

    @test async containsKeyOnEmptyMap() {
        await AbstractNamedCacheTestsSuite.cache.clear();
        expect(await AbstractNamedCacheTestsSuite.cache.containsKey('123')).to.equal(false);
    }

    @test async containsKeyOnExistingMapping() {
        expect(await AbstractNamedCacheTestsSuite.cache.containsKey('123')).to.equal(true);
    }

    @test async containsKeyOnNonExistingMapping() {
        expect(await AbstractNamedCacheTestsSuite.cache.containsKey('34556')).to.equal(false);    
    }

    @test async containsKeyWithComplexKey() {
        const cache2 = AbstractNamedCacheTestsSuite.session.getCache<any, any>('States');
        await cache2.put(val123, val234);
        expect(await cache2.containsKey(val123)).to.equal(true);    
    }
}


@suite(timeout(3000))
class ContainsValueSuite 
    extends AbstractNamedCacheTestsSuite {
    
    @test async containsValueOnEmptyMap() {
        await AbstractNamedCacheTestsSuite.cache.clear();
        expect(await AbstractNamedCacheTestsSuite.cache.containsValue(val123)).to.equal(false);
    }

    @test async containsValueOnExistingMapping() {
        expect(await AbstractNamedCacheTestsSuite.cache.containsValue(val123)).to.equal(true);
    }

    @test async containsValueOnNonExistingMapping() {
        expect(await AbstractNamedCacheTestsSuite.cache.containsValue({id:123, name: 'abc'})).to.equal(false);    
    }
}

@suite(timeout(3000))
class GetSuite 
    extends AbstractNamedCacheTestsSuite {
    
    @test async getOnEmptyMap() {
        await AbstractNamedCacheTestsSuite.cache.clear();
        expect(await AbstractNamedCacheTestsSuite.cache.get('123')).to.equal(null);
    }

    @test async getOnExistingMapping() {
        expect(await AbstractNamedCacheTestsSuite.cache.get('123')).to.eql(val123);
        expect(await AbstractNamedCacheTestsSuite.cache.get('456')).to.eql(val456);
    }

    @test async getOnNonExistingMapping() {
        expect(await AbstractNamedCacheTestsSuite.cache.get({id:123, name: 'abc'})).to.equal(null);  
        expect(await AbstractNamedCacheTestsSuite.cache.get('123456')).to.equal(null);    
    }
}

@suite(timeout(3000))
class GetAllTestsSuite
    extends AbstractNamedCacheTestsSuite {
    
    @test 
    async testOnEmptyMap() {
        await AbstractNamedCacheTestsSuite.cache.clear();
        const result = await AbstractNamedCacheTestsSuite.cache.getAll(['123']);

        expect(result.size).to.equal(0);
        expect(Array.from(result)).to.have.deep.members([]);       
    }
    @test 
    async testWithEmptyKeys() {
        expect(await AbstractNamedCacheTestsSuite.cache.size()).to.equal(4);
        const result = await AbstractNamedCacheTestsSuite.cache.getAll([]);
        expect(result.size).to.equal(0);
        expect(await AbstractNamedCacheTestsSuite.cache.size()).to.equal(4);
        expect(Array.from(result)).to.have.deep.members([]);       
    }
    @test 
    async testWithExistingKeys() {
        expect(await AbstractNamedCacheTestsSuite.cache.size()).to.equal(4);
        const entries = await AbstractNamedCacheTestsSuite.cache.getAll(['123', '234', '345']);

        expect(entries.size).to.equal(3);
        expect(Array.from(entries.keys())).to.have.deep.members(['123', '234', '345']);       
        expect(Array.from(entries.values())).to.have.deep.members([val123, val234, val345]);       
    }
}


@suite(timeout(3000))
class GetOrDefaultSuite 
    extends AbstractNamedCacheTestsSuite {
    
    dVal: any = {id:1234, name: '1234'};
    
    @test async getOrDefaultOnEmptyMap() {
        await AbstractNamedCacheTestsSuite.cache.clear();
        expect(await AbstractNamedCacheTestsSuite.cache.getOrDefault('123abc', this.dVal)).to.eql(this.dVal);
    }

    @test async getOrDefaultOnExistingMapping() {
        expect(await AbstractNamedCacheTestsSuite.cache.getOrDefault('123', this.dVal)).to.eql(val123);
    }

    @test async getOnNonExistingMapping() {
        expect(await AbstractNamedCacheTestsSuite.cache.getOrDefault({id:123, name: 'abc'}, this.dVal)).to.eql(this.dVal);  
    }
}

@suite(timeout(3000))
class PutSuite 
    extends AbstractNamedCacheTestsSuite {

    @test async putOnEmptyMap() {
        await AbstractNamedCacheTestsSuite.cache.clear();
        expect(await AbstractNamedCacheTestsSuite.cache.put('123', val123)).to.equal(null);
    }

    @test async getOnExistingMapping() {
        expect(await AbstractNamedCacheTestsSuite.cache.put('123', {id:123})).to.eql(val123);
        expect(await AbstractNamedCacheTestsSuite.cache.get('123')).to.eql({id: 123});
        expect(await AbstractNamedCacheTestsSuite.cache.put('123', val123)).to.eql({id: 123});
        expect(await AbstractNamedCacheTestsSuite.cache.get('123')).to.eql(val123);
    }

    @test async getOnNonExistingMapping() {
        expect(await AbstractNamedCacheTestsSuite.cache.get('123456')).to.equal(null);    
    }
}


@suite(timeout(3000))
class IsEmptySuite 
    extends AbstractNamedCacheTestsSuite {

    @test async isEmptyOnEmptyMap() {
        await AbstractNamedCacheTestsSuite.cache.clear();
        expect(await AbstractNamedCacheTestsSuite.cache.isEmpty()).to.equal(true);
    }

    @test async checkSizeWhenIsEmptyIsTrue() {
        await AbstractNamedCacheTestsSuite.cache.clear();
        expect(await AbstractNamedCacheTestsSuite.cache.size()).to.equal(0);
        expect(await AbstractNamedCacheTestsSuite.cache.isEmpty()).to.equal(true);
    }

    @test async checkSizeWhenIsEmptyIsFalse() {
        expect(await AbstractNamedCacheTestsSuite.cache.size()).to.not.equal(0);
        expect(await AbstractNamedCacheTestsSuite.cache.isEmpty()).to.equal(false);
    }

    @test async checkSizeAndIsEmptyOnPut() {
        await AbstractNamedCacheTestsSuite.cache.clear();
        expect(await AbstractNamedCacheTestsSuite.cache.size()).to.equal(0);
        expect(await AbstractNamedCacheTestsSuite.cache.isEmpty()).to.equal(true);

        await AbstractNamedCacheTestsSuite.cache.put(val123, val234);

        expect(await AbstractNamedCacheTestsSuite.cache.size()).to.not.equal(0);
        expect(await AbstractNamedCacheTestsSuite.cache.isEmpty()).to.equal(false);
    }
}


@suite(timeout(3000))
class InvokeSuite 
    extends AbstractNamedCacheTestsSuite {

    @test async invokeOnAnExistingKey() {
        expect(await AbstractNamedCacheTestsSuite.cache.invoke('123', Processors.extract())).to.eql(val123);
    }
    @test async invokeOnANonExistingKey() {
        expect(await AbstractNamedCacheTestsSuite.cache.invoke('123456', Processors.extract())).to.equal(null);
    }
}

@suite(timeout(3000))
class InvokeAllSuite 
    extends AbstractNamedCacheTestsSuite {

    @test 
    async invokeAllWithKeys() {
        const requestKeys : Set<string> = new Set(['123', '234', '345', '456']);
        const result = await AbstractNamedCacheTestsSuite.cache.invokeAll(requestKeys, Processors.extract());

        let {keys, values} = super.extractKeysAndValues(result);
        expect(Array.from(keys)).to.have.deep.members(['345', '123', '234', '456']);
        expect(Array.from(values)).to.have.deep.members([val123, val234, val345, val456]);
    }
    @test 
    async invokeAllWithASubsetOfKeys() {
        const requestKeys : Set<string> = new Set(['234', '345']);
        const result = await AbstractNamedCacheTestsSuite.cache.invokeAll(requestKeys, Processors.extract());

        let {keys, values} = super.extractKeysAndValues(result);
        expect(Array.from(keys)).to.have.deep.members(Array.from(requestKeys));
        expect(Array.from(values)).to.have.deep.members([val234, val345]);    
    }
    @test 
    async invokeAllWithEmptyKeys() {
        const requestKeys : Set<string> = new Set([]);
        const result = await AbstractNamedCacheTestsSuite.cache.invokeAll(requestKeys, Processors.extract());

        let {keys, values} = super.extractKeysAndValues(result);
        expect(Array.from(keys)).to.have.deep.members(['345', '123', '234', '456']);
        expect(Array.from(values)).to.have.deep.members([val123, val234, val345, val456]);       
    }
    @test async invokeAllWithAlwaysFilter() {
        const result = await AbstractNamedCacheTestsSuite.cache.invokeAll(Filters.always(), Processors.extract());

        let {keys, values} = super.extractKeysAndValues(result);

        expect(keys.length).to.equal(4);
        expect(values.length).to.equal(4);

        expect(Array.from(keys)).to.have.deep.members(['123', '234', '345', '456']);
        expect(Array.from(values)).to.have.deep.members([val123, val234, val345, val456]);
    }
}
