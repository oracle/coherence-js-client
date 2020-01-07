// Reference mocha-typescript's global definitions:
/// <reference path='../node_modules/mocha-typescript/globals.d.ts' />

import { RequestFactory } from '../src/cache/request_factory';
import { expect } from 'chai';

import { Extractors } from '../src/extractor/extractors';
import { Filters } from '../src/filter/filters';

import { NamedCacheClient } from '../src/cache/named_cache_client'
import { Processors } from '../src/processor/processors';

const cache = new NamedCacheClient<any, any>('States');

const val123 = {id: 123, str: '123', ival: 123, fval: 12.3};
const val234 = {id: 234, str: '234', ival: 234, fval: 23.4};
const val345 = {id: 345, str: '345', ival: 345, fval: 34.5};
const val456 = {id: 456, str: '456', ival: 456, fval: 45.6};

class BaseClientTestsSuite {
    async before() {
        await cache.clear();
        
        await cache.put("123", val123)
        await cache.put("234", val234)
        await cache.put("345", val345)
        await cache.put("456", val456)
    }

    protected extractKeysAndValues(map: Map<any, any>): {keys: Array<any>, values: Array<any>} {
        const keys = new Array<any>();
        const values = new Array<any>();

        for (let [key, value] of map) {
            keys.push(key);
            values.push(value);
        }
        return {keys, values};
    }
}

@suite(timeout(3000))
class ClearSuite 
    extends BaseClientTestsSuite {

    async before() {
        await cache.clear();
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
        await cache.clear(); 
        expect(await cache.isEmpty()).to.equal(true);
    }
}

@suite(timeout(3000))
class AddIndexSuite 
    extends BaseClientTestsSuite {

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
    extends BaseClientTestsSuite {

    @test async checkSize() {
        expect(await cache.size()).to.equal(4);
    }
    
    @test async containsEntryOnEmptyMap() {
        await cache.clear();
        expect(await cache.containsEntry('123', val123))
        .to.equal(false);
    }

    @test async containsEntryOnExistingMapping() {
        expect(await cache.size()).to.equal(4);
        expect(await cache.containsEntry('123', val123)).to.equal(true);
    }

    @test async containsEntryOnNonExistingMapping() {
        expect(await cache.containsEntry('345', {id: 123, str: '123'})).to.equal(false);    
    }

    @test async containsEntryWithComplexKey() {
        const cache2 = new NamedCacheClient<any, any>('States');
        await cache2.put(val123, val234);
        expect(await cache2.containsEntry(val123, val234)).to.equal(true);    
    }
}

@suite(timeout(3000))
class ContainsKeySuite 
    extends BaseClientTestsSuite {
    
    @test async containsKeyOnEmptyMap() {
        await cache.clear();
        expect(await cache.containsKey('123')).to.equal(false);
    }

    @test async containsKeyOnExistingMapping() {
        expect(await cache.containsKey('123')).to.equal(true);
    }

    @test async containsKeyOnNonExistingMapping() {
        expect(await cache.containsKey('34556')).to.equal(false);    
    }

    @test async containsKeyWithComplexKey() {
        const cache2 = new NamedCacheClient<any, any>('States');
        await cache2.put(val123, val234);
        expect(await cache2.containsKey(val123)).to.equal(true);    
    }
}


@suite(timeout(3000))
class ContainsValueSuite 
    extends BaseClientTestsSuite {
    
    @test async containsValueOnEmptyMap() {
        await cache.clear();
        expect(await cache.containsValue(val123)).to.equal(false);
    }

    @test async containsValueOnExistingMapping() {
        expect(await cache.containsValue(val123)).to.equal(true);
    }

    @test async containsValueOnNonExistingMapping() {
        expect(await cache.containsValue({id:123, name: 'abc'})).to.equal(false);    
    }
}

@suite(timeout(3000))
class GetSuite 
    extends BaseClientTestsSuite {
    
    @test async getOnEmptyMap() {
        await cache.clear();
        expect(await cache.get('123')).to.equal(null);
    }

    @test async getOnExistingMapping() {
        expect(await cache.get('123')).to.eql(val123);
        expect(await cache.get('456')).to.eql(val456);
    }

    @test async getOnNonExistingMapping() {
        expect(await cache.get({id:123, name: 'abc'})).to.equal(null);  
        expect(await cache.get('123456')).to.equal(null);    
    }
}

@suite(timeout(3000))
class GetOrDefaultSuite 
    extends BaseClientTestsSuite {
    
    dVal: any = {id:1234, name: '1234'};
    
    @test async getOrDefaultOnEmptyMap() {
        await cache.clear();
        expect(await cache.getOrDefault('123abc', this.dVal)).to.eql(this.dVal);
    }

    @test async getOrDefaultOnExistingMapping() {
        expect(await cache.getOrDefault('123', this.dVal)).to.eql(val123);
    }

    @test async getOnNonExistingMapping() {
        expect(await cache.getOrDefault({id:123, name: 'abc'}, this.dVal)).to.eql(this.dVal);  
    }
}

@suite(timeout(3000))
class PutSuite 
    extends BaseClientTestsSuite {
    
    @test async putOnEmptyMap() {
        await cache.clear();
        expect(await cache.put('123', val123)).to.equal(null);
    }

    @test async getOnExistingMapping() {
        expect(await cache.put('123', {id:123})).to.eql(val123);
        expect(await cache.get('123')).to.eql({id: 123});
        expect(await cache.put('123', val123)).to.eql({id: 123});
        expect(await cache.get('123')).to.eql(val123);
    }

    @test async getOnNonExistingMapping() {
        expect(await cache.get('123456')).to.equal(null);    
    }
}


@suite(timeout(3000))
class IsEmptySuite 
    extends BaseClientTestsSuite {
    
    @test async isEmptyOnEmptyMap() {
        await cache.clear();
        expect(await cache.isEmpty()).to.equal(true);
    }

    @test async checkSizeWhenIsEmptyIsTrue() {
        await cache.clear();
        expect(await cache.size()).to.equal(0);
        expect(await cache.isEmpty()).to.equal(true);
    }

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
    extends BaseClientTestsSuite {

    @test async invokeOnAnExistingKey() {
        expect(await cache.invoke('123', Processors.extract())).to.eql(val123);
    }
    @test async invokeOnANonExistingKey() {
        expect(await cache.invoke('123456', Processors.extract())).to.equal(null);
    }
}

@suite(timeout(3000))
class InvokeAllSuite 
    extends BaseClientTestsSuite {

    @test 
    async invokeAllWithKeys() {
        const requestKeys : Set<string> = new Set(['123', '234', '345', '456']);
        const result = await cache.invokeAll(requestKeys, Processors.extract());

        let {keys, values} = super.extractKeysAndValues(result);
        expect(Array.from(keys)).to.have.deep.members(['345', '123', '234', '456']);
        expect(Array.from(values)).to.have.deep.members([val123, val234, val345, val456]);
    }
    @test 
    async invokeAllWithASubsetOfKeys() {
        const requestKeys : Set<string> = new Set(['234', '345']);
        const result = await cache.invokeAll(requestKeys, Processors.extract());

        let {keys, values} = super.extractKeysAndValues(result);
        expect(Array.from(keys)).to.have.deep.members(Array.from(requestKeys));
        expect(Array.from(values)).to.have.deep.members([val234, val345]);    
    }
    @test 
    async invokeAllWithEmptyKeys() {
        const requestKeys : Set<string> = new Set([]);
        const result = await cache.invokeAll(requestKeys, Processors.extract());

        let {keys, values} = super.extractKeysAndValues(result);
        expect(Array.from(keys)).to.have.deep.members(['345', '123', '234', '456']);
        expect(Array.from(values)).to.have.deep.members([val123, val234, val345, val456]);       
    }
    @test async invokeAllWithAlwaysFilter() {
        const result = await cache.invokeAll(Filters.always(), Processors.extract());

        let {keys, values} = super.extractKeysAndValues(result);

        expect(keys.length).to.equal(4);
        expect(values.length).to.equal(4);

        expect(Array.from(keys)).to.have.deep.members(['123', '234', '345', '456']);
        expect(Array.from(values)).to.have.deep.members([val123, val234, val345, val456]);
    }
}