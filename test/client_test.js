/* test/cache_test.js */

const chai            = require('chai');
const expect          = chai.expect;
const chaiAsPromised  = require("chai-as-promised");
chai.use(chaiAsPromised);

const CacheClient     = require('../client.js');
const cache          = new CacheClient("Persons");
const invCache       = new CacheClient("");

describe('NamedCacheService', function() {

  this.timeout(15000);

  beforeEach(async () => {
    await cache.clear();
    expect(await cache.size()).to.equal(0)
  });


  describe('#clear', function() {

    it('clear an empty cache', async () => {
      await cache.clear();
      expect(await cache.size()).to.equal(0)
    });

    it('clear a non empty cache', async () => {
      await cache.put("foo", {name: "name", age: 100})
      expect(await cache.size()).to.equal(1)

      await cache.clear();
      expect(await cache.size()).to.equal(0)
    });

    it('clear multiple times on a cache', async () => {
      for (let i = 0; i < 3; i++) {
        await cache.clear();
      }
      expect(await cache.size()).to.equal(0)
    });

  }); // #clear


  describe('#isEmpty', function() {

    it('isEmpty on an empty cache should be true', async () => {
      expect(await cache.isEmpty()).to.equal(true)
    });

    it('isEmpty on a non empty cache should be false', async () => {
      await cache.put("foo", {name: "name", age: 100})
      expect(await cache.size()).to.equal(1);
      expect(await cache.isEmpty()).to.equal(false);
    });

    it('isEmpty after clear should be true', async () => {
      await cache.put("foo", {name: "name", age: 100})
      expect(await cache.size()).to.equal(1);

      await cache.clear();
      expect(await cache.isEmpty()).to.equal(true);
    });

  }); // #isEmpty


  describe('#size', function() {

    it('size should be zero on an empty cache', async () => {
      expect(await cache.size()).to.equal(0);
    });

    it('size should be non zero after a put', async () => {
      expect(await cache.size()).to.equal(0);
      await cache.put("foo", {name: "name", age: 100})
      await cache.put("turtle", {name: "Turtle", age: 200})
      expect(await cache.size()).to.equal(2);
    });

  }); // #size


  describe('#put', function() {

    const key1 = {k : 123};
    const key2 = {k : 12345};
    const person1 = {name: "Name-789", age: 10};
    const person2 = {name: "Name-123567", age: 100};

    it('put on an empty cache', async () => {
      await cache.put(key1, person1);
      expect(await cache.size()).to.equal(1);
      expect(await cache.isEmpty()).to.equal(false);
    });

    it('put on a non empty cache', async () => {
      await cache.put(key1, person1);
      expect(await cache.size()).to.equal(1);
      expect(await cache.isEmpty()).to.equal(false);

      await cache.put(key2, person2);
      expect(await cache.size()).to.equal(2);
      expect(await cache.isEmpty()).to.equal(false);
    });

    it('put on a non existent mapping should return null', async () => {
      expect(await cache.put(key1, person1)).to.equal(null);
      expect(await cache.size()).to.equal(1);
    });

    it('put on an existing mapping should return previous value', async () => {
      await cache.put(key1, person1);
      expect(await cache.put(key1, person2)).to.eql(person1);
      expect(await cache.size()).to.equal(1);
    });

    it('multiple put on a loop', async () => {
      for (let i = 0; i < 10; i++) {
        await cache.put({k : i}, {v: i*2});
      }
      expect(await cache.size()).to.equal(10);

      for (let i = 0; i < 10; i++) {
        let v = await cache.put({k : i}, {v: i*5});
        expect(v).to.eql({v: i*2});
      }
    });

  }); // #put


  describe('#get', function() {

    const key1 = {k : 12345};
    const person1 = {name: "Name-789", age: 10};

    it('get on a non existent mapping should return null', async () => {
      expect(await cache.get({k: "--"})).to.equal(null);
    });

    it('get on an existing mapping should return that value', async () => {
      await cache.put(key1, person1);
      expect(await cache.get(key1)).to.eql(person1);
    });

    it('multiple get on a loop', async () => {
      for (let i = 0; i < 10; i++) {
        await cache.put({k : i}, {v: i*2});
      }
      expect(await cache.size()).to.equal(10);

      for (let i = 0; i < 10; i++) {
        let v = await cache.get({k : i});
        expect(v).to.eql({v: i*2});
      }
    });

  }); // #get
});
