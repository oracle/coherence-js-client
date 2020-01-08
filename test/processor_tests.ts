// Reference mocha-typescript's global definitions:
/// <reference path='../node_modules/mocha-typescript/globals.d.ts' />

import {
    AbstractNamedCacheTestsSuite,
    cache, nested,
    val123, val234, val345, val456,
    toObj, tscObj, trieObj, jadeObj, javascriptObj
} from './abstract_named_cache_tests';

import { expect } from 'chai';

import { Extractors } from '../src/extractor/extractors';
import { Filters } from '../src/filter/filters';
import { Processors } from '../src/processor/processors';
import { Util } from '../src/util/util';

@suite(timeout(3000))
class ExtractorProcessorTestsSuite
    extends AbstractNamedCacheTestsSuite {

    // ExtractorProcessor
    @test
    testTypeNameOfExtractorProcessor() {
        const processor = Processors.extract('str');        
        expect(processor['@class']).to.equal(Util.PROCESSOR_PACKAGE + 'ExtractorProcessor');     
    }
    @test
    async testInvoke() {
        const processor = Processors.extract('id').andThen(Processors.extract('str'));
        const value = await cache.invoke('123', processor);  

        expect(value.length).to.equal(2)
        expect(value).to.have.deep.members([123, '123']);       
    }
    @test
    async testInvokeAllWithKeys() {
        const processor = Processors.extract('id').andThen(Processors.extract('str'));
        const result = await cache.invokeAll(new Set(['123', '234']), processor);

        expect(result.size).to.equal(2)
        expect(Array.from(result.keys())).to.have.deep.members(['123', '234']);       
        expect(Array.from(result.values())).to.have.deep.members([[123, '123'], [234, '234']]);            
    }
    @test
    async testInvokeAllWithFilter() {
        const processor = Processors.extract('id').andThen(Processors.extract('str'));
        const result = await cache.invokeAll(Filters.always(), processor);

        expect(result.size).to.equal(4)
        expect(Array.from(result.keys())).to.have.deep.members(['123', '234', '345', '456']);       
        expect(Array.from(result.values())).to.have.deep.members([
            [123, '123'], [234, '234'], [345, '345'], [456, '456']
        ]);            
    }
    @test
    async testInvokeAllWithExtractorFilter() {
        const processor = Processors.extract();
        const f1 = Filters.equal(Extractors.chained('j.a.v.word'), "JavaScript")
                          .or(Filters.equal(Extractors.chained('j.a.d.word'), "Jade"));

        const result = await nested.invokeAll(f1, processor);
        expect(Array.from(result.keys()).length).to.equal(2);
        expect(Array.from(result.values()).length).to.equal(2);
        expect(Array.from(result.keys())).to.have.deep.members(['JavaScript', 'Jade']);
        expect(Array.from(result.values())).to.have.deep.members([javascriptObj, jadeObj]);
    }
}

// CompositeProcessor
@suite(timeout(3000))
class CompositeProcessorTestsSuite
    extends AbstractNamedCacheTestsSuite {

    @test
    testTypeName() {
        const ep = Processors.extract('id');
        expect(ep['@class']).to.equal(Util.PROCESSOR_PACKAGE + 'ExtractorProcessor');     

        const cp = ep.andThen(Processors.extract('str'))
            .andThen(Processors.extract('iVal'));
        expect(cp['@class']).to.equal(Util.PROCESSOR_PACKAGE + 'CompositeProcessor');     
    }
    @test
    async testInvoke() {
        const processor = Processors.extract('id').andThen(Processors.extract('str'));
        const value = await cache.invoke('123', processor);  

        expect(value.length).to.equal(2)
        expect(value).to.have.deep.members([123, '123']);       
    }
    @test
    async testInvokeAllWithContainsAnyFilter() {
        const filter = Filters.arrayContainsAny(Extractors.extract('iarr'), [1, 2])
        const processor = Processors.extract('id').andThen(Processors.extract('str'));

        const result = await cache.invokeAll(filter, processor);    
        //        expect(Array.from(result.keys())).to.have.deep.members(['123', '234', '345', '456']);       
 
        expect(Array.from(result).length).to.equal(2);
        expect(Array.from(result.keys())).to.have.deep.members(['123', '234']);    
        expect(Array.from(result.values())).to.have.deep.members([[123, '123'], [234, '234']]);    
    }
    @test
    async testInvokeAllWithContainsAllFilter() {
        const filter = Filters.arrayContainsAll(Extractors.extract('iarr'), [2, 4])
        const processor = Processors.extract('id').andThen(Processors.extract('str'));

        const result = await cache.invokeAll(filter, processor);     
        expect(Array.from(result).length).to.equal(1);
        expect(Array.from(result.keys())).to.have.deep.members(['234']);    
        expect(Array.from(result.values())).to.have.deep.members([[234, '234']]);     
    }
}

// ConditionalProcessor
@suite(timeout(3000))
class ConditionalProcessorTestsSuite
    extends AbstractNamedCacheTestsSuite {

    @test
    testTypeName() {
        const ep = Processors.extract('str')
            .when(Filters.arrayContainsAll(Extractors.extract('iarr'), [1, 2]));

        expect(ep['@class']).to.equal(Util.PROCESSOR_PACKAGE + 'ConditionalProcessor');  
    }
    @test
    async testInvokeWithKey() {
        const ep = Processors.extract('str')
            .when(Filters.arrayContainsAll(Extractors.extract('iarr'), [1, 2]));

        const value = await cache.invoke('123', ep); 
        expect(value).to.equal('123'); 
    }
    @test
    async testInvokeAllWithMultipleKeys() {
        const ep = Processors.extract('str')
            .when(Filters.arrayContainsAny(Extractors.extract('iarr'), [2, 3]));

        const value = await cache.invokeAll(new Set(['234', '345', '456']), ep); 
        expect(Array.from(value.keys())).to.have.deep.members(['234', '345']);
        expect(Array.from(value.values())).to.have.deep.members(['234', '345']);
    }
    @test
    async testInvokeAllWithFilter() {
        const ep = Processors.extract('str')
            .when(Filters.arrayContainsAny(Extractors.extract('iarr'), [2, 3]));

        const value = await cache.invokeAll(new Set(['234', '345', '456']), ep); 
        expect(Array.from(value.keys())).to.have.deep.members(['234', '345']);
        expect(Array.from(value.values())).to.have.deep.members(['234', '345']);
    }
}

// ConditionalPutProcessor
@suite(timeout(3000))
class ConditionalPutProcessorTestsSuite
    extends AbstractNamedCacheTestsSuite {

    @test
    testTypeName() {
        const ep = Processors.conditionalPut(Filters.always(), 'someValue');
        expect(ep['@class']).to.equal(Util.PROCESSOR_PACKAGE + 'ConditionalPut');  
        expect(ep.doesReturnValue()).to.equal(false);         
        expect(ep.getValue()).to.equal('someValue');        
    }
    @test
    async testInvoke() {
        const f1 = Filters.arrayContainsAll(Extractors.extract('iarr'), [1, 2]);
        const ep = Processors.conditionalPut(f1, val234).returnCurrent();
        const value = await cache.invoke('123', ep); 
        
        expect(await cache.get('123')).to.eql(val234);
        expect(await cache.get('234')).to.eql(val234);
        expect(await cache.get('345')).to.eql(val345);
        expect(await cache.get('456')).to.eql(val456);
    }
    @test
    async testInvokeAllWithFilter() {
        const f1 = Filters.arrayContainsAny(Extractors.extract('iarr'), [1, 2]);
        const ep = Processors.conditionalPut(Filters.always(), val234).returnCurrent();

        await cache.invokeAll(f1, ep);  

        expect(await cache.get('123')).to.eql(val234);
        expect(await cache.get('234')).to.eql(val234);
        expect(await cache.get('345')).to.eql(val345);
        expect(await cache.get('456')).to.eql(val456);
    }
}

// ConditionalPutAllProcessor
@suite(timeout(3000))
class ConditionalPutAllProcessorTestsSuite
    extends AbstractNamedCacheTestsSuite {

    @test
    testTypeNameOf() {
        const ep = Processors.conditionalPutAll(Filters.always(), new Map());
        expect(ep['@class']).to.equal(Util.PROCESSOR_PACKAGE + 'ConditionalPutAll');   
    }
    @test
    async testInvokeAllWithJustProcessor() {
        const values = new Map();
        values.set('123', val234);
        values.set('345', val456);
        const ep = Processors.conditionalPutAll(Filters.always(), values);

        await cache.invokeAll(ep); 
        
        expect(await cache.get('123')).to.eql(val234);
        expect(await cache.get('234')).to.eql(val234);
        expect(await cache.get('345')).to.eql(val456);
        expect(await cache.get('456')).to.eql(val456);
    }
    @test
    async testInvokeAllWithFilter() {
        const values = new Map();
        values.set('123', val234);
        values.set('345', val456);
        const ep = Processors.conditionalPutAll(Filters.arrayContainsAny(Extractors.extract('iarr'), [1, 2]), values);

        await cache.invokeAll(Filters.always(), ep);  

        expect(await cache.get('123')).to.eql(val234);
        expect(await cache.get('234')).to.eql(val234);
        expect(await cache.get('345')).to.eql(val345);
        expect(await cache.get('456')).to.eql(val456);
    }
    @test
    async testInvokeAllWithKeys() {
        const values = new Map();
        values.set('123', val234);
        values.set('345', val456);
        const filter = Filters.arrayContainsAny(Extractors.extract('iarr'), [1, 2])
        const ep = Processors.conditionalPutAll(filter, values);

        await cache.invokeAll(['123', '234', '345', '456'], ep);  

        expect(await cache.get('123')).to.eql(val234);
        expect(await cache.get('234')).to.eql(val234);
        expect(await cache.get('345')).to.eql(val345);
        expect(await cache.get('456')).to.eql(val456);
    }
    @test
    async testIfExistingEntriesCanBeUpdated() {
        const newVal1 = {id: 123456, str: '123456', ival: 123456, fval: 123.456, iarr: [1, 2, 3, 4, 5, 6]};
        const newVal2 = {id: 234567, str: '234567', ival: 234567, fval: 234.567, iarr: [2, 3, 4, 5, 6, 7]};

        const values = new Map();
        values.set('123', newVal1);
        values.set('234', newVal2);
        values.set('2-123', newVal1);
        values.set('2-234', newVal2);
        const ep = Processors.conditionalPutAll(Filters.present(), values);

        await cache.invokeAll(ep);  

        expect(await cache.get('123')).to.eql(newVal1);
        expect(await cache.get('234')).to.eql(newVal2);
        expect(await cache.get('345')).to.eql(val345);
        expect(await cache.get('456')).to.eql(val456);
        expect(await cache.get('2-123')).to.equal(null);
        expect(await cache.get('2-234')).to.equal(null);
    }
    @test
    async testIfMissingEntriesCanBeInserted() {
        const newVal1 = {id: 123456, str: '123456', ival: 123456, fval: 123.456, iarr: [1, 2, 3, 4, 5, 6]};
        const newVal2 = {id: 234567, str: '234567', ival: 234567, fval: 234.567, iarr: [2, 3, 4, 5, 6, 7]};

        const values = new Map();
        values.set('123', newVal1);
        values.set('234', newVal2);
        values.set('123456', newVal1);
        values.set('234567', newVal2);

        const ep = Processors.conditionalPutAll(Filters.not(Filters.present()), values);
        await cache.invokeAll(['123', '234', '345', '456', '123456', '234567'], ep);  

        expect(await cache.size()).to.equal(6);
        expect(await cache.get('123')).to.eql(val123);
        expect(await cache.get('234')).to.eql(val234);
        expect(await cache.get('345')).to.eql(val345);
        expect(await cache.get('456')).to.eql(val456);
        expect(await cache.get('123456')).to.eql(newVal1);
        expect(await cache.get('234567')).to.eql(newVal2);
    }
}