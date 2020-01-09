// Reference mocha-typescript's global definitions:
/// <reference path='../node_modules/mocha-typescript/globals.d.ts' />

import { expect } from 'chai';

import { Extractors } from '../src/extractor/extractors';
import { Filters } from '../src/filter/filters';
import { Processors } from '../src/processor/processors';
import { Util } from '../src/util/util';

import {
    AbstractNamedCacheTestsSuite,
    val123, val234, val345, val456,
    trieObj, jadeObj, javascriptObj, versioned123, versioned456, versioned234, versioned345
} from './abstract_named_cache_tests';

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
        const value = await this.cache.invoke('123', processor);

        expect(value.length).to.equal(2)
        expect(value).to.have.deep.members([123, '123']);
    }
    @test
    async testInvokeAllWithKeys() {
        const processor = Processors.extract('id').andThen(Processors.extract('str'));
        const result = await this.cache.invokeAll(new Set(['123', '234']), processor);

        expect(result.size).to.equal(2)
        expect(Array.from(result.keys())).to.have.deep.members(['123', '234']);
        expect(Array.from(result.values())).to.have.deep.members([[123, '123'], [234, '234']]);
    }
    @test
    async testInvokeAllWithFilter() {
        const processor = Processors.extract('id').andThen(Processors.extract('str'));
        const result = await this.cache.invokeAll(Filters.always(), processor);

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

        const result = await this.nested.invokeAll(f1, processor);
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
        const value = await this.cache.invoke('123', processor);

        expect(value.length).to.equal(2)
        expect(value).to.have.deep.members([123, '123']);
    }
    @test
    async testInvokeAllWithContainsAnyFilter() {
        const filter = Filters.arrayContainsAny(Extractors.extract('iarr'), [1, 2])
        const processor = Processors.extract('id').andThen(Processors.extract('str'));

        const result = await this.cache.invokeAll(filter, processor);
        //        expect(Array.from(result.keys())).to.have.deep.members(['123', '234', '345', '456']);       

        expect(Array.from(result).length).to.equal(2);
        expect(Array.from(result.keys())).to.have.deep.members(['123', '234']);
        expect(Array.from(result.values())).to.have.deep.members([[123, '123'], [234, '234']]);
    }
    @test
    async testInvokeAllWithContainsAllFilter() {
        const filter = Filters.arrayContainsAll(Extractors.extract('iarr'), [2, 4])
        const processor = Processors.extract('id').andThen(Processors.extract('str'));

        const result = await this.cache.invokeAll(filter, processor);
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

        const value = await this.cache.invoke('123', ep);
        expect(value).to.equal('123');
    }
    @test
    async testInvokeAllWithMultipleKeys() {
        const ep = Processors.extract('str')
            .when(Filters.arrayContainsAny(Extractors.extract('iarr'), [2, 3]));

        const value = await this.cache.invokeAll(new Set(['234', '345', '456']), ep);
        expect(Array.from(value.keys())).to.have.deep.members(['234', '345']);
        expect(Array.from(value.values())).to.have.deep.members(['234', '345']);
    }
    @test
    async testInvokeAllWithFilter() {
        const ep = Processors.extract('str')
            .when(Filters.arrayContainsAny(Extractors.extract('iarr'), [2, 3]));

        const value = await this.cache.invokeAll(new Set(['234', '345', '456']), ep);
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
        expect(ep.doesReturnValue()).to.equal(true);
        expect(ep.getValue()).to.equal('someValue');
    }
    @test
    async testInvoke() {
        const f1 = Filters.arrayContainsAll(Extractors.extract('iarr'), [1, 2]);
        const ep = Processors.conditionalPut(f1, val234).returnCurrent();
        const value = await this.cache.invoke('123', ep);

        expect(await this.cache.get('123')).to.eql(val234);
        expect(await this.cache.get('234')).to.eql(val234);
        expect(await this.cache.get('345')).to.eql(val345);
        expect(await this.cache.get('456')).to.eql(val456);
    }
    @test
    async testInvokeAllWithFilter() {
        const f1 = Filters.arrayContainsAny(Extractors.extract('iarr'), [1, 2]);
        const ep = Processors.conditionalPut(Filters.always(), val234).returnCurrent();

        await this.cache.invokeAll(f1, ep);

        expect(await this.cache.get('123')).to.eql(val234);
        expect(await this.cache.get('234')).to.eql(val234);
        expect(await this.cache.get('345')).to.eql(val345);
        expect(await this.cache.get('456')).to.eql(val456);
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

        await this.cache.invokeAll(ep);

        expect(await this.cache.get('123')).to.eql(val234);
        expect(await this.cache.get('234')).to.eql(val234);
        expect(await this.cache.get('345')).to.eql(val456);
        expect(await this.cache.get('456')).to.eql(val456);
    }
    @test
    async testInvokeAllWithFilter() {
        const values = new Map();
        values.set('123', val234);
        values.set('345', val456);
        const ep = Processors.conditionalPutAll(Filters.arrayContainsAny(Extractors.extract('iarr'), [1, 2]), values);

        await this.cache.invokeAll(Filters.always(), ep);

        expect(await this.cache.get('123')).to.eql(val234);
        expect(await this.cache.get('234')).to.eql(val234);
        expect(await this.cache.get('345')).to.eql(val345);
        expect(await this.cache.get('456')).to.eql(val456);
    }
    @test
    async testInvokeAllWithKeys() {
        const values = new Map();
        values.set('123', val234);
        values.set('345', val456);
        const filter = Filters.arrayContainsAny(Extractors.extract('iarr'), [1, 2])
        const ep = Processors.conditionalPutAll(filter, values);

        await this.cache.invokeAll(['123', '234', '345', '456'], ep);

        expect(await this.cache.get('123')).to.eql(val234);
        expect(await this.cache.get('234')).to.eql(val234);
        expect(await this.cache.get('345')).to.eql(val345);
        expect(await this.cache.get('456')).to.eql(val456);
    }
    @test
    async testIfExistingEntriesCanBeUpdated() {
        const newVal1 = { id: 123456, str: '123456', ival: 123456, fval: 123.456, iarr: [1, 2, 3, 4, 5, 6] };
        const newVal2 = { id: 234567, str: '234567', ival: 234567, fval: 234.567, iarr: [2, 3, 4, 5, 6, 7] };

        const values = new Map();
        values.set('123', newVal1);
        values.set('234', newVal2);
        values.set('2-123', newVal1);
        values.set('2-234', newVal2);
        const ep = Processors.conditionalPutAll(Filters.present(), values);

        await this.cache.invokeAll(ep);

        expect(await this.cache.get('123')).to.eql(newVal1);
        expect(await this.cache.get('234')).to.eql(newVal2);
        expect(await this.cache.get('345')).to.eql(val345);
        expect(await this.cache.get('456')).to.eql(val456);
        expect(await this.cache.get('2-123')).to.equal(null);
        expect(await this.cache.get('2-234')).to.equal(null);
    }
    @test
    async testIfMissingEntriesCanBeInserted() {
        const newVal1 = { id: 123456, str: '123456', ival: 123456, fval: 123.456, iarr: [1, 2, 3, 4, 5, 6] };
        const newVal2 = { id: 234567, str: '234567', ival: 234567, fval: 234.567, iarr: [2, 3, 4, 5, 6, 7] };

        const values = new Map();
        values.set('123', newVal1);
        values.set('234', newVal2);
        values.set('123456', newVal1);
        values.set('234567', newVal2);

        const ep = Processors.conditionalPutAll(Filters.not(Filters.present()), values);
        await this.cache.invokeAll(['123', '234', '345', '456', '123456', '234567'], ep);

        expect(await this.cache.size()).to.equal(6);
        expect(await this.cache.get('123')).to.eql(val123);
        expect(await this.cache.get('234')).to.eql(val234);
        expect(await this.cache.get('345')).to.eql(val345);
        expect(await this.cache.get('456')).to.eql(val456);
        expect(await this.cache.get('123456')).to.eql(newVal1);
        expect(await this.cache.get('234567')).to.eql(newVal2);
    }
}

// ConditionalRemoveProcessor
@suite(timeout(3000))
class ConditionalRemoveProcessorTestsSuite
    extends AbstractNamedCacheTestsSuite {

        
    @test
    testTypeNameOf() {
        const ep = Processors.conditionalRemove(Filters.always());
        expect(ep['@class']).to.equal(Util.PROCESSOR_PACKAGE + 'ConditionalRemove');
    }
    @test
    async testRemovalOfOneExistingKey() {
        expect(await this.cache.size()).to.equal(4);
        expect(await this.cache.get('123')).to.eql(val123);

        const ep = Processors.conditionalRemove(Filters.present());
        const removedValue = await this.cache.invoke('123', ep);
        expect(removedValue).to.equal(null);

        expect(await this.cache.size()).to.equal(3);
        expect(await this.cache.get('123')).to.equal(null);
    }
    @test
    async testRemovalWithNeverFilter() {
        expect(await this.cache.size()).to.equal(4);
        expect(await this.cache.get('123')).to.eql(val123);

        const ep = Processors.conditionalRemove(Filters.never()).returnCurrent();
        const removedValue = await this.cache.invoke('123', ep);
        expect(removedValue).to.eql(val123);

        expect(await this.cache.size()).to.equal(4);
        expect(await this.cache.get('123')).to.eql(val123);
    }
}

// VersionedPutProcessor
@suite(timeout(3000))
class VersionedPutProcessorTestsSuite
    extends AbstractNamedCacheTestsSuite {
        
    @test
    testTypeNameOf() {
        const ep = Processors.versionedPut(versioned123);
        expect(ep['@class']).to.equal(Util.PROCESSOR_PACKAGE + 'VersionedPut');
    }
    @test
    async testForExistingEntry() {
        const ep = Processors.versionedPut(versioned123);
        await this.versioned.invoke('123', ep);

        const expected = {'@version': 2, id: 123, str: '123', ival: 123, fval: 12.3, iarr: [1, 2, 3]};
        expect(await this.versioned.get('123')).to.eql(expected);
    }
    @test
    async testForNonExistentMatch() {
        const ep = Processors.versionedPut(versioned123);
        await this.versioned.invoke('456', ep);

        expect(await this.versioned.get('456')).to.eql(versioned456);
    }
    @test
    async testForMultipleUpdates() {
        const ep = Processors.versionedPut(versioned123);
        await this.versioned.invoke('456', ep);

        expect(await this.versioned.get('456')).to.eql(versioned456);
    }
}

// VersionedPutAllProcessor
@suite(timeout(3000))
class VersionedPutAllProcessorTestsSuite
    extends AbstractNamedCacheTestsSuite {
        
    @test
    testTypeNameOf() {
        const ep = Processors.versionedPutAll(new Map());
        expect(ep['@class']).to.equal(Util.PROCESSOR_PACKAGE + 'VersionedPutAll');
        expect(ep.insert).to.equal(false);
        expect(ep['return']).to.equal(false);
    }
    @test
    async testForExistingEntry() {
        const entries = new Map();
        entries.set('123', versioned123);
        entries.set('456', versioned456);
        const ep = Processors.versionedPutAll(entries, true);

        const result = await this.versioned.invokeAll(['123', '456'], ep);
        console.log("** VersionedPutAllProcessor result size: " + result.size);

        const expected123 = {'@version': 2, id: 123, str: '123', ival: 123, fval: 12.3, iarr: [1, 2, 3]};
        const expected456 = {'@version': 5, id: 456, str: '456', ival: 456, fval: 45.6, iarr: [4, 5, 6], nullIfOdd: 'non-null'};
        
        expect(await this.versioned.get('123')).to.eql(expected123);
        expect(await this.versioned.get('234')).to.eql(versioned234);
        expect(await this.versioned.get('345')).to.eql(versioned345);
        expect(await this.versioned.get('456')).to.eql(expected456);

        console.log("**Versioned456: " + JSON.stringify(await this.versioned.get('456')));

    }
}