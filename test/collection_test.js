/* test/cache_test.js */

const chai = require('chai'),
  expect = chai.expect;

const chaiAsPromised = require('chai-as-promised');

const states = require('./states.js');
const coherence = require('../target/src/cache/named_cache_client.js');
const async_iter = require('../target/src/cache/async_iter.js');

const cache = new coherence.NamedCacheClient("States");

const Iter = new async_iter.AsyncIter();


chai.use(chaiAsPromised);

describe('NamedCacheService', function () {

  this.timeout(15000);

  beforeEach(async () => {
    await cache.clear();
    expect(await cache.size()).to.equal(0)
  });

  describe('#keySet', async function () {

    it('should return empty key set from an empty cache', async () => {
      expect(await cache.size()).to.equal(0);
      let count = 0;
      for await (let val of cache.keySet()) {
        count++;
      }
      expect(count).to.equal(0);
    });

    it('should return keys from a non empty cache', async () => {
      await cache.put("ca", states.ca);
      await cache.put("ny", states.ny);

      const keySet = new Set();
      for await (let key of cache.keySet()) {
        keySet.add(key);
      }

      expect(keySet.size).to.equal(2);
      expect(keySet.has("ca")).to.equal(true);
      expect(keySet.has("ny")).to.equal(true);
      expect(await cache.keySet().size()).to.equal(2);
    });

    it('should clear cache from keySet', async () => {
      await cache.put("ca", states.ca);
      await cache.put("ny", states.ny);

      expect(await cache.keySet().size()).to.equal(2);
      await cache.keySet().clear();
      expect(await cache.keySet().size()).to.equal(0);
    });

  });

  describe('#entrySet', async function () {

    it('should return empty entry set from an empty cache', async () => {
      expect(await cache.size()).to.equal(0);
      let count = 0;
      for await (let val of cache.entrySet()) {
        count++;
      }
      expect(count).to.equal(0);
    });

    it('should return entries from a non empty cache', async () => {
      await cache.put("ca", states.ca);
      await cache.put("ny", states.ny);

      const keySet = new Set();
      const map = new Map();
      for await (let e of cache.entrySet()) {
        keySet.add(e.getKey());
        map.set(e.getKey(), e.getValue());
      }

      expect(keySet.size).to.equal(2);

      expect(keySet.has("ca")).to.equal(true);
      expect(keySet.has("ny")).to.equal(true);

      expect(map.get("ca")).to.eql(states.ca);
      expect(map.get("ny")).to.eql(states.ny);
    });

    it('should clear cache from keySet', async () => {
      await cache.put("ca", states.ca);
      await cache.put("ny", states.ny);

      expect(await cache.entrySet().size()).to.equal(2);
      await cache.entrySet().clear();
      expect(await cache.entrySet().size()).to.equal(0);
    });

  });

  describe('#values', async function () {

    it('should return empty values set from an empty cache', async () => {
      expect(await cache.size()).to.equal(0);
      let count = 0;
      for await (let val of cache.values()) {
        count++;
      }
      expect(count).to.equal(0);
    });

    it('should return values from a non empty cache', async () => {

      await cache.put("ca", states.ca);
      await cache.put("ny", states.ny);

      const map = new Map();
      map.set("CA", states.ca);
      map.set("NY", states.ny);

      for await (let v of cache.values()) {
        expect(map.get(v.abbreviation)).to.eql(v);
      }

    });

    it('should clear cache from values set', async () => {
      await cache.put("ca", states.ca);
      await cache.put("ny", states.ny);

      expect(await cache.values().size()).to.equal(2);
      await cache.values().clear();
      expect(await cache.values().size()).to.equal(0);
    });

  });


  const func = function (a, b) {
    const w = 0.2;

    return a + w * b;
  }



});