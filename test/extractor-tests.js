/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

const { Filters, Extractors, Session } = require('../lib')
const test = require('./util')
const assert = require('assert').strict
const { describe, it, after, beforeEach } = require('mocha');

describe('Extractor IT Test Suite', function () {
  const session = new Session()
  this.timeout(30000)

  describe('A ValueExtractor', () => {
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

    const cache = session.getCache('nested-cache')
    this.timeout(30000)

    beforeEach(async () => {
      await cache.clear()
      await cache.set(toKey, toObj)
      await cache.set(tscKey, tscObj)
      await cache.set(trieKey, trieObj)
      await cache.set(jadeKey, jadeObj)
      await cache.set(javascriptKey, javascriptObj)

      assert.equal(await cache.empty, false)
      assert.equal(await cache.size, 5)
    })

    after(() => {
      cache.release().finally(() => session.close().catch())
    })

    it('should be composable by chaining extractors to narrow results', async () => {
      const f1 = Filters.equal(
        Extractors.chained(
          [Extractors.extract('t'),   // t field
          Extractors.extract('r'),   // r field of t
          Extractors.extract('word')] // word field of r
        ), 'Trie')
      await test.compareEntries([[trieKey, trieObj]], await cache.entries(f1))
    })

    it('should be composable using a compound string to chain extractors to narrow results', async () => {
      const ext = Extractors.chained('t.r.word')
      const f1 = Filters.equal(ext, 'Trie')
      await test.compareEntries([[trieKey, trieObj]], await cache.entries(f1))
    })

    it('should be composable by applying a multi extractor', async () => {
      const f1 = Filters.equal(
        Extractors.multi(
          [Extractors.chained('t.r.word'),
            Extractors.chained('t.r.word'),
            Extractors.chained('t.r.word')]
        ), ['Trie', 'Trie', 'Trie'])

      await test.compareEntries([[trieKey, trieObj]], await cache.entries(f1))
    })

    it('should be composable by applying a multi extractor as a string', async () => {
      const ext = Extractors.multi('t.r.word')
      const f1 = Filters.equal(ext, ['Trie'])
      await test.compareEntries([[trieKey, trieObj]], await cache.entries(f1))
    })
  })
})
