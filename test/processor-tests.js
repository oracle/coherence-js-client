/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

const { Filters, Extractors, Processors, Session } = require('../lib')
const t = require('./util')
const assert = require('assert').strict
const { describe, it, after, beforeEach } = require('mocha');

describe('processor.Processors IT Test Suite', function () {
  const val123 = { id: 123, str: '123', ival: 123, fval: 12.3, iarr: [1, 2, 3], group: 1 }
  const val234 = { id: 234, str: '234', ival: 234, fval: 23.4, iarr: [2, 3, 4], group: 2, nullIfOdd: 'non-null' }
  const val345 = { id: 345, str: '345', ival: 345, fval: 34.5, iarr: [3, 4, 5], group: 2 }
  const val456 = { id: 456, str: '456', ival: 456, fval: 45.6, iarr: [4, 5, 6], group: 3, nullIfOdd: 'non-null' }

  const toKey = { name: 'To' }
  const tscKey = { name: 'TypeScript' }
  const trieKey = { name: 'Trie' }
  const jadeKey = { name: 'Jade' }
  const javascriptKey = { name: 'JavaScript' }

  const toObj = { t: { o: { level: 3, word: 'To', tokens: ['t', 'o'] } } }
  const tscObj = { t: { y: { level: 3, word: 'TypeScript', tokens: ['t', 'y'] } } }
  const trieObj = { t: { r: { level: 3, word: 'Trie', tokens: ['t', 'r'] } } }
  const jadeObj = { j: { a: { d: { level: 4, word: 'Jade', tokens: ['j', 'a', 'd'] } } } }
  const javascriptObj = { j: { a: { level: 4, v: { word: 'JavaScript', tokens: ['j', 'a', 'v'] } } } }

  const versioned123 = { '@version': 1, id: 123, str: '123', ival: 123, fval: 12.3, iarr: [1, 2, 3] }
  const versioned234 = {
    '@version': 2,
    id: 234,
    str: '234',
    ival: 234,
    fval: 23.4,
    iarr: [2, 3, 4],
    nullIfOdd: 'non-null'
  }
  const versioned345 = { '@version': 3, id: 345, str: '345', ival: 345, fval: 34.5, iarr: [3, 4, 5] }
  const versioned456 = {
    '@version': 4,
    id: 456,
    str: '456',
    ival: 456,
    fval: 45.6,
    iarr: [4, 5, 6],
    nullIfOdd: 'non-null'
  }

  const session = new Session()

  const cache = session.getCache('client-cache')
  const nested = session.getCache('nest-cache')
  const versioned = session.getCache('versioned-cache')

  this.timeout(300000)

  beforeEach(async () => {
    await cache.clear()
    await nested.clear()
    await versioned.clear()

    await cache.set(val123, val123)
    await cache.set(val234, val234)
    await cache.set(val345, val345)
    await cache.set(val456, val456)

    await nested.set(toKey, toObj)
    await nested.set(tscKey, tscObj)
    await nested.set(trieKey, trieObj)
    await nested.set(jadeKey, jadeObj)
    await nested.set(javascriptKey, javascriptObj)

    await versioned.set('123', versioned123)
    await versioned.set('234', versioned234)
    await versioned.set('345', versioned345)
    await versioned.set('456', versioned456)

    assert.equal(await cache.empty, false)
    assert.equal(await cache.size, 4)

    assert.equal(await nested.empty, false)
    assert.equal(await nested.size, 5)

    assert.equal(await versioned.empty, false)
    assert.equal(await versioned.size, 4)
  })

  after(async () => {
    await cache.release().finally(() => session.close().catch())
  })

  describe('An EntryProcessor', () => {
    it('should be composable', async () => {
      const composite = Processors.nop().andThen(Processors.nop())

      assert.equal(composite['@class'], 'processor.CompositeProcessor')
      // noinspection JSAccessibilityCheck
      assert.deepEqual(composite.processors, [Processors.nop(), Processors.nop()])
    })

    it('should be conditional', async () => {
      const conditional = Processors.nop().when(Filters.isNotNull('id'))

      assert.equal(conditional['@class'], 'processor.ConditionalProcessor')
      assert.deepEqual(conditional.processor, Processors.nop())
      assert.deepEqual(conditional.filter, Filters.isNotNull('id'))
    })
  })

  describe('An ExtractorProcessor', () => {
    it('should have the proper internal type', async () => {
      const processor = Processors.extract('str')
      assert.equal(processor['@class'], 'processor.ExtractorProcessor')
    })

    it('should be able to be invoked against a value associated with a key', async () => {
      const processor = Processors.extract('id').andThen(Processors.extract('str'))
      const value = await cache.invoke(val123, processor)

      assert.equal(value.length, 2)
      assert.deepEqual(value, [123, '123'])
    })

    it('should be able to be invoked against all entries using a filter', async () => {
      const processor = Processors.extract('id').andThen(Processors.extract('str'))
      const result = await cache.invokeAll(Filters.always(), processor)

      await t.compareEntries([[val123, [123, '123']], [val234, [234, '234']],
        [val345, [345, '345']], [val456, [456, '456']]], result)
    })

    it('should be able to be invoked against all entries using a set of keys', async () => {
      const processor = Processors.extract('id').andThen(Processors.extract('str'))
      const result = await cache.invokeAll([val123, val234], processor)

      await t.compareEntries([[val123, [123, '123']], [val234, [234, '234']]], result)
    })
  })

  describe('A CompositeProcessor', () => {
    it('should be able to be invoked against a value associated with a key', async () => {
      const processor = Processors.extract('id').andThen(Processors.extract('str'))
      const value = await cache.invoke(val123, processor)

      assert.equal(value.length, 2)
      assert.deepEqual(value, [123, '123'])
    })

    it('should be able to be invoked against all entries using a filter', async () => {
      const processor = Processors.extract('id').andThen(Processors.extract('str'))
      const result = await cache.invokeAll(Filters.always(), processor)

      await t.compareEntries([[val123, [123, '123']], [val234, [234, '234']],
        [val345, [345, '345']], [val456, [456, '456']]], result)
    })

    it('should be able to be invoked against entries matching a set of keys', async () => {
      const processor = Processors.extract('id').andThen(Processors.extract('str'))
      const result = await cache.invokeAll([val123, val234], processor)

      await t.compareEntries([[val123, [123, '123']], [val234, [234, '234']]], result)
    })
  })

  describe('A ConditionalProcessor', () => {
    it('should be able to be invoked against a value associated with a key', async () => {
      const ep = Processors.extract('str')
        .when(Filters.arrayContainsAll(Extractors.extract('iarr'), new Set([1, 2])))
      const value = await cache.invoke(val123, ep)

      assert.equal(value, '123')
    })

    it('should be able to be invoked against all entries using a filter', async () => {
      const ep = Processors.extract('str')
        .when(Filters.arrayContainsAll(Extractors.extract('iarr'), new Set([2, 3])))
      const result = await cache.invokeAll(Filters.always(), ep)

      await t.compareEntries([[val123, '123'], [val234, '234']], result)
    })

    it('should be able to be invoked against entries matching a set of keys', async () => {
      const ep = Processors.extract('str')
        .when(Filters.arrayContainsAll(Extractors.extract('iarr'), new Set([2, 3])))
      const result = await cache.invokeAll([val123, val234, val345], ep)

      await t.compareEntries([[val123, '123'], [val234, '234']], result)
    })
  })

  describe('A ConditionalPut Processor', () => {
    it('should have the proper internal type', async () => {
      const processor = Processors.conditionalPut(Filters.always(), 'someValue')

      assert.equal(processor['@class'], 'processor.ConditionalPut')
    })

    it('should be able to be invoked against a value associated with a key', async () => {
      const f1 = Filters.arrayContainsAll(Extractors.extract('iarr'), new Set([1, 2]))
      const ep = Processors.conditionalPut(f1, val234).returnCurrent()

      await cache.invoke(val123, ep)

      await t.compareEntries([[val123, val234], [val234, val234],
        [val345, val345], [val456, val456]], await cache.entries())
    })

    it('should be able to be invoked against all entries using a filter', async () => {
      const f1 = Filters.arrayContainsAll(Extractors.extract('iarr'), new Set([3, 4]))
      const ep = Processors.conditionalPut(Filters.always(), val123).returnCurrent()

      await cache.invokeAll(f1, ep)

      await t.compareEntries([[val123, val123], [val234, val123],
        [val345, val123], [val456, val456]], await cache.entries())
    })

    it('should be able to be invoked against all entries using a set of keys', async () => {
      const f1 = Filters.arrayContainsAll(Extractors.extract('iarr'), new Set([3, 4]))
      const ep = Processors.conditionalPut(f1, val123).returnCurrent()

      await cache.invokeAll([val123, val234], ep)

      await t.compareEntries([[val123, val123], [val234, val123],
        [val345, val345], [val456, val456]], await cache.entries())
    })
  })

  describe('A ConditionalPutAll Processor', () => {
    it('should have the proper internal type', async () => {
      const processor = Processors.conditionalPutAll(Filters.always(), new Map().set('a', 'b'))

      assert.equal(processor['@class'], 'processor.ConditionalPutAll')
      assert.deepEqual(processor.filter, Filters.always())
      assert.notEqual(processor.entries, undefined)
    })

    it('should be able to ve invoked against all entries', async () => {
      const values = new Map([[val123, val345], [val345, val456]])
      const ep = Processors.conditionalPutAll(Filters.always(), values)

      await cache.invokeAll(ep)

      await t.compareEntries([[val123, val345], [val234, val234],
        [val345, val456], [val456, val456]], await cache.entries())
    })

    it('should be able to be invoked against all entries using a set of keys', async () => {
      const values = new Map([['a', 'b']])
      const ep = Processors.conditionalPutAll(Filters.not(Filters.present()), values)

      await cache.invokeAll([val123, 'a'], ep)

      await t.compareEntries([[val123, val123], [val234, val234],
        [val345, val345], [val456, val456], ['a', 'b']], await cache.entries())
    })
  })

  describe('A ConditionalRemove Processor', () => {
    it('should have the proper internal type', async () => {
      const processor = Processors.conditionalRemove(Filters.always())

      assert.equal(processor['@class'], 'processor.ConditionalRemove')
    })

    it('should be able to be invoked against a value associated with a key', async () => {
      const f1 = Filters.arrayContainsAll(Extractors.extract('iarr'), new Set([1, 2]))
      const ep = Processors.conditionalRemove(f1).returnCurrent()

      const result = await cache.invoke(val123, ep)

      assert.equal(result, null)
      await t.compareEntries([[val234, val234], [val345, val345], [val456, val456]], await cache.entries())
    })

    it('should be able to be invoked against all entries using a filter', async () => {
      const f1 = Filters.arrayContainsAll(Extractors.extract('iarr'), new Set([3, 4]))
      const ep = Processors.conditionalRemove(Filters.always()).returnCurrent()

      const result = await cache.invokeAll(f1, ep)

      assert.deepEqual(result.size, 0)
      await t.compareEntries([[val123, val123], [val456, val456]], await cache.entries())
    })

    it('should be able to be invoked against all entries using a set of keys', async () => {
      const f1 = Filters.arrayContainsAll(Extractors.extract('iarr'), new Set([3, 4]))
      const ep = Processors.conditionalRemove(f1).returnCurrent()

      await cache.invokeAll([val123, val234], ep)

      assert.deepEqual(val123, val123)
      await t.compareEntries([[val123, val123], [val345, val345], [val456, val456]], await cache.entries())
    })
  })

  describe('A VersionedPut Processor', () => {
    it('should have the proper internal type', async () => {
      const processor = Processors.versionedPut(Filters.always())

      assert.equal(processor['@class'], 'processor.VersionedPut')
    })

    it('should be able to be invoked against a value associated with a key', async () => {
      const ep = Processors.versionedPut(versioned123)
      const result = await versioned.invoke('123', ep)

      const expected = { '@version': 2, id: 123, str: '123', ival: 123, fval: 12.3, iarr: [1, 2, 3] }
      assert.equal(result, null)
      assert.deepEqual(await versioned.get('123'), expected)
    })

    it('should be able to be invoked against all entries using a filter', async () => {
      const f1 = Filters.arrayContains(Extractors.extract('iarr'), 1)
      const ep = Processors.versionedPut(versioned123)

      const result = await versioned.invokeAll(f1, ep)

      const expected = { '@version': 2, id: 123, str: '123', ival: 123, fval: 12.3, iarr: [1, 2, 3] }
      assert.deepEqual(result.size, 0)
      await t.compareEntries([['123', expected], ['234', versioned234], ['345', versioned345],
        ['456', versioned456]], await versioned.entries())
    })

    it('should be able to be invoked against all entries using a set of keys', async () => {
      const ep = Processors.versionedPut(versioned123)

      const result = await versioned.invokeAll(['123', '456'], ep)

      const expected = { '@version': 2, id: 123, str: '123', ival: 123, fval: 12.3, iarr: [1, 2, 3] }
      assert.deepEqual(result.size, 0)
      await t.compareEntries([['123', expected], ['234', versioned234], ['345', versioned345],
        ['456', versioned456]], await versioned.entries())
    })
  })

  describe('A VersionedPutAll Processor', () => {
    it('should have the proper internal type', async () => {
      const processor = Processors.versionedPutAll(new Map())

      assert.equal(processor['@class'], 'processor.VersionedPutAll')
    })

    it('should be able to be invoked against all entries', async () => {
      const entries = new Map([['123', versioned123], ['456', versioned456]])
      const ep = Processors.versionedPutAll(entries)

      const result = await versioned.invokeAll(ep)

      const expected123 = { '@version': 2, id: 123, str: '123', ival: 123, fval: 12.3, iarr: [1, 2, 3] }
      const expected456 = {
        '@version': 5,
        id: 456,
        str: '456',
        ival: 456,
        fval: 45.6,
        iarr: [4, 5, 6],
        nullIfOdd: 'non-null'
      }

      assert.deepEqual(result.size, 0)
      await t.compareEntries([['123', expected123], ['234', versioned234], ['345', versioned345],
        ['456', expected456]], await versioned.entries())
    })

    it('should be able to be invoked against all entries using a filter', async () => {
      const entries = new Map([['123', versioned123], ['456', versioned456]])
      const ep = Processors.versionedPutAll(entries)

      const result = await versioned.invokeAll(Filters.always(), ep)

      const expected123 = { '@version': 2, id: 123, str: '123', ival: 123, fval: 12.3, iarr: [1, 2, 3] }
      const expected456 = {
        '@version': 5,
        id: 456,
        str: '456',
        ival: 456,
        fval: 45.6,
        iarr: [4, 5, 6],
        nullIfOdd: 'non-null'
      }

      assert.deepEqual(result.size, 0)
      await t.compareEntries([['123', expected123], ['234', versioned234], ['345', versioned345],
        ['456', expected456]], await versioned.entries())
    })

    it('should be able to be invoked against all entries using a set of keys', async () => {
      const entries = new Map([['123', versioned123], ['456', versioned456]])
      const ep = Processors.versionedPutAll(entries)

      const result = await versioned.invokeAll(['123', '456'], ep)

      const expected123 = { '@version': 2, id: 123, str: '123', ival: 123, fval: 12.3, iarr: [1, 2, 3] }
      const expected456 = {
        '@version': 5,
        id: 456,
        str: '456',
        ival: 456,
        fval: 45.6,
        iarr: [4, 5, 6],
        nullIfOdd: 'non-null'
      }

      assert.deepEqual(result.size, 0)
      await t.compareEntries([['123', expected123], ['234', versioned234], ['345', versioned345],
        ['456', expected456]], await versioned.entries())
    })
  })

  describe('An Updater Processor', () => {
    it('should have the proper internal type', async () => {
      const processor = Processors.update('a.b.ival', 12300)

      assert.equal(processor['@class'], 'processor.UpdaterProcessor')
      assert.notDeepEqual(processor.value, undefined)
      // noinspection JSAccessibilityCheck
      assert.notDeepEqual(processor.updater, undefined)
    })

    it('should be able to be invoked against a value associated with a key', async () => {
      const ep = Processors.update('str', '123000')
        .andThen(Processors.update('ival', 123000))

      const result = await cache.invoke(val123, ep)

      const processor = Processors.extract('ival').andThen(Processors.extract('str'))
      const value = await cache.invoke(val123, processor)

      const others = await cache.getAll([val234, val345, val456])

      assert.deepEqual(result, [true, true])
      assert.equal(value.length, 2)
      assert.deepEqual(value, [123000, '123000'])
      await t.compareEntries([[val234, val234], [val345, val345], [val456, val456]], others)
    })

    it('should be able to be invoked against all entries using a filter', async () => {
      const f1 = Filters.arrayContainsAll(Extractors.extract('iarr'), new Set([3, 4]))
      const ep = Processors.update('str', '123000')
        .andThen(Processors.update('ival', 123000))

      const result = await cache.invokeAll(f1, ep)

      const processor = Processors.extract('ival').andThen(Processors.extract('str'))
      const value = await cache.invokeAll([val234, val345], processor)

      const others = await cache.getAll([val123, val456])

      await t.compareEntries([[val234, [123000, '123000']], [val345, [123000, '123000']]], value)
      await t.compareEntries([[val234, [true, true]], [val345, [true, true]]], result)
      await t.compareEntries([[val123, val123], [val456, val456]], others)
    })

    it('should be able to be invoked against all entries using a set of keys', async () => {
      const ep = Processors.update('str', '123000')
        .andThen(Processors.update('ival', 123000))

      const result = await cache.invokeAll([val234, val345], ep)

      const processor = Processors.extract('ival').andThen(Processors.extract('str'))
      const value = await cache.invokeAll([val234, val345], processor)

      const others = await cache.getAll([val123, val456])

      await t.compareEntries([[val234, [123000, '123000']], [val345, [123000, '123000']]], value)
      await t.compareEntries([[val234, [true, true]], [val345, [true, true]]], result)
      await t.compareEntries([[val123, val123], [val456, val456]], others)
    })
  })

  describe('A MethodInvocation Processor (non-mutating)', () => {
    it('should have the proper internal type', async () => {
      const processor = Processors.invokeAccessor('a.b.ival', 12300, 12301)

      assert.equal(processor['@class'], 'processor.MethodInvocationProcessor')
      assert.equal(processor.methodName, 'a.b.ival')
      assert.equal(processor.mutator, false)
      assert.deepEqual(processor.args, [12300, 12301])
    })

    it('should be able to be invoked against a value associated with a key', async () => {
      const ep = Processors.invokeAccessor('get', 'ival')
      const value = await cache.invoke(val123, ep)

      assert.equal(value, 123)
    })

    it('should be able to be invoked against all entries using a filter', async () => {
      const ep = Processors.invokeAccessor('get', 'ival')
      const value = await cache.invokeAll(Filters.greater('ival', 200), ep)

      await t.compareEntries([[val234, 234], [val345, 345], [val456, 456]], value)
    })

    it('should be able to be invoked against all entries using a set of keys', async () => {
      const ep = Processors.invokeAccessor('get', 'ival')
      const value = await cache.invokeAll([val234, val345], ep)

      await t.compareEntries([[val234, 234], [val345, 345]], value)
    })
  })

  describe('A MethodInvocation Processor (mutating)', () => {
    it('should have the proper internal type', async () => {
      const processor = Processors.invokeMutator('a.b.ival', 12300, 12301)

      assert.equal(processor['@class'], 'processor.MethodInvocationProcessor')
      assert.equal(processor.methodName, 'a.b.ival')
      assert.equal(processor.mutator, true)
      assert.deepEqual(processor.args, [12300, 12301])
    })

    it('should be able to be invoked against a value associated with a key', async () => {
      const ep = Processors.invokeMutator('remove', 'ival')
      const value = await cache.invoke(val123, ep)

      assert.equal(value, 123)
    })

    it('should be able to be invoked against all entries using a filter', async () => {
      const ep = Processors.invokeMutator('remove', 'ival')
        .andThen(Processors.invokeMutator('remove', 'iarr'))

      const result = await cache.invokeAll(Filters.greater('ival', 200), ep)

      // Check removed values
      await t.compareEntries([[val234, [234, [2, 3, 4]]], [val345, [345, [3, 4, 5]]], [val456, [456, [4, 5, 6]]]], result)

      // Ensure that remaining attributes are still intact.
      await t.compareEntries([[val123, val123],
        [val234, { id: 234, str: '234', fval: 23.4, group: 2, nullIfOdd: 'non-null' }],
        [val345, { id: 345, str: '345', fval: 34.5, group: 2 }],
        [val456, { id: 456, str: '456', fval: 45.6, group: 3, nullIfOdd: 'non-null' }]], await cache.entries())
    })

    it('should be able to be invoked against all entries using a set of keys', async () => {
      const ep = Processors.invokeMutator('remove', 'ival')
        .andThen(Processors.invokeMutator('remove', 'iarr'))

      const result = await cache.invokeAll([val234, val345], ep)

      // Check removed values
      await t.compareEntries([[val234, [234, [2, 3, 4]]], [val345, [345, [3, 4, 5]]]], result)

      // Ensure that remaining attributes are still intact.
      await t.compareEntries([[val123, val123],
        [val234, { id: 234, str: '234', fval: 23.4, group: 2, nullIfOdd: 'non-null' }],
        [val345, { id: 345, str: '345', fval: 34.5, group: 2 }],
        [val456, val456]], await cache.entries())
    })
  })

  describe('A NumberMultiplier processor', () => {
    it('should have the proper internal type', async () => {
      const processor = Processors.multiply('ival', 2)

      assert.equal(processor['@class'], 'processor.NumberMultiplier')
      // noinspection JSAccessibilityCheck
      assert.equal(processor.multiplier, 2)
      // noinspection JSAccessibilityCheck
      assert.equal(processor.postMultiplication, false)

      const processor2 = Processors.multiply('ival', 2, true)
      // noinspection JSAccessibilityCheck
      assert.equal(processor2.postMultiplication, true)
    })

    it('should be able to be invoked against a value associated with a key', async () => {
      const processor = Processors.multiply('ival', 2)

      const result = await cache.invoke(val123, processor)
      assert.equal(result, 246)
    })

    it('should be able to be invoked against all entries using a filter', async () => {
      const processor = Processors.multiply('ival', 2)

      const result = await cache.invokeAll(Filters.greater('ival', 200), processor)

      // Check result
      await t.compareEntries([[val234, 468], [val345, 690], [val456, 912]], result)

      // Ensure that remaining attributes are still intact.
      await t.compareEntries([[val123, val123],
        [val234, { id: 234, str: '234', ival: 468, fval: 23.4, iarr: [2, 3, 4], group: 2, nullIfOdd: 'non-null' }],
        [val345, { id: 345, str: '345', ival: 690, fval: 34.5, iarr: [3, 4, 5], group: 2 }],
        [val456, { id: 456, str: '456', ival: 912, fval: 45.6, iarr: [4, 5, 6], group: 3, nullIfOdd: 'non-null' }]], await cache.entries())
    })

    it('should be able to be invoked against all entries using a set of keys', async () => {
      const processor = Processors.multiply('ival', 2)

      const result = await cache.invokeAll([val234, val345, val456], processor)

      // Check result
      await t.compareEntries([[val234, 468], [val345, 690], [val456, 912]], result)

      // Ensure that remaining attributes are still intact.
      await t.compareEntries([[val123, val123],
        [val234, { id: 234, str: '234', ival: 468, fval: 23.4, iarr: [2, 3, 4], group: 2, nullIfOdd: 'non-null' }],
        [val345, { id: 345, str: '345', ival: 690, fval: 34.5, iarr: [3, 4, 5], group: 2 }],
        [val456, { id: 456, str: '456', ival: 912, fval: 45.6, iarr: [4, 5, 6], group: 3, nullIfOdd: 'non-null' }]], await cache.entries())
    })
  })

  describe('A NumberIncrementor processor', () => {
    it('should have the proper internal type', async () => {
      const processor = Processors.increment('ival', 2)

      assert.equal(processor['@class'], 'processor.NumberIncrementor')
      // noinspection JSAccessibilityCheck
      assert.equal(processor.increment, 2)
      // noinspection JSAccessibilityCheck
      assert.equal(processor.postIncrement, false)

      const processor2 = Processors.increment('ival', 2, true)
      // noinspection JSAccessibilityCheck
      assert.equal(processor2.postIncrement, true)
    })

    it('should be able to be invoked against a value associated with a key', async () => {
      const processor = Processors.increment('ival', 2)

      const result = await cache.invoke(val123, processor)
      assert.equal(result, 125)
    })

    it('should be able to be invoked against all entries using a filter', async () => {
      const processor = Processors.increment('ival', 2)

      const result = await cache.invokeAll(Filters.greater('ival', 200), processor)

      // Check result
      await t.compareEntries([[val234, 236], [val345, 347], [val456, 458]], result)

      // Ensure that remaining attributes are still intact.
      await t.compareEntries([[val123, val123],
        [val234, { id: 234, str: '234', ival: 236, fval: 23.4, iarr: [2, 3, 4], group: 2, nullIfOdd: 'non-null' }],
        [val345, { id: 345, str: '345', ival: 347, fval: 34.5, iarr: [3, 4, 5], group: 2 }],
        [val456, { id: 456, str: '456', ival: 458, fval: 45.6, iarr: [4, 5, 6], group: 3, nullIfOdd: 'non-null' }]], await cache.entries())
    })

    it('should be able to be invoked against all entries using a set of keys', async () => {
      const processor = Processors.increment('ival', 2)

      const result = await cache.invokeAll([val234, val345, val456], processor)

      // Check result
      await t.compareEntries([[val234, 236], [val345, 347], [val456, 458]], result)

      // Ensure that remaining attributes are still intact.
      await t.compareEntries([[val123, val123],
        [val234, { id: 234, str: '234', ival: 236, fval: 23.4, iarr: [2, 3, 4], group: 2, nullIfOdd: 'non-null' }],
        [val345, { id: 345, str: '345', ival: 347, fval: 34.5, iarr: [3, 4, 5], group: 2 }],
        [val456, {
          id: 456,
          str: '456',
          ival: 458,
          fval: 45.6,
          iarr: [4, 5, 6],
          group: 3,
          nullIfOdd: 'non-null'
        }]], await cache.entries())
    })
  })

  describe('A PreloadRequest processor', () => {
    it('should have the proper internal type', async () => {
      const processor = Processors.preload()

      assert.equal(processor['@class'], 'processor.PreloadRequest')
    })

    it('should be able to be invokable', async () => {
      const processor = Processors.preload()

      const result = await cache.invoke(val123, processor)
      assert.equal(result, null)
    })
  })

  describe('A Touch processor', () => {
    it('should have the proper internal type', async () => {
      const processor = Processors.touch()

      assert.equal(processor['@class'], 'processor.TouchProcessor')
    })
  })

  describe('A Script processor', () => {
    it('should have the proper internal type', async () => {
      const processor = Processors.script('js', 'jsprocessor', 'a', 'b')

      assert.equal(processor['@class'], 'processor.ScriptProcessor')
      assert.equal(processor['language'], 'js')
      assert.equal(processor['name'], 'jsprocessor')
      assert.deepEqual(processor['args'], ['a', 'b'])
    })
  })
})
