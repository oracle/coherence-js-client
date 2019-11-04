/* test/cache_test.js */

const chai            = require('chai');
const expect          = chai.expect;
const chaiAsPromised  = require("chai-as-promised");
chai.use(chaiAsPromised);

const CacheClient     = require('../client.js');
const cache           = new CacheClient("Persons");
const invCache        = new CacheClient("");

describe('NamedCacheService', function() {

  this.timeout(15000);

  const states = {
    ca: {
      name: "California",
      abbreviation: "CA",
      capital: "Sacramento",
      tz: "Pacific",
      population: 39.55,
      neighbors: ["OR", "NV", "AZ"]
    },
    ny: {
      name: "New York",
      abbreviation: "NY",
      capital: "Albany",
      tz: "Eastern",
      population: 19.54,
      neighbors: ["NJ", "PN", "CT", "MA", "VA"]
    },
  }

  beforeEach(async () => {
    await cache.clear();
    expect(await cache.size()).to.equal(0)
  });


  describe('#clear', function() {

    it('size should be zero', async () => {
      await cache.clear();

      expect(await cache.size()).to.equal(0);
    });

    it('isEmpty should be true', async () => {
      expect(await cache.isEmpty()).to.equal(true);
    });

    it('get should return null', async () => {
      expect(await cache.get('ca')).to.equal(null);
    });

    it('should be able to call clear again', async () => {
      await cache.clear();

      expect(await cache.isEmpty()).to.equal(true);
    });

  }); // #clear


  describe('#isEmpty', function() {

    it('after clear isEmpty should be true', async () =>  {
      expect(await cache.isEmpty()).to.equal(true);
    });

    it('after put isEmpty should be false', async () => {
      await cache.put('ca', states.ca);

      expect(await cache.isEmpty()).to.equal(false);
    });

    it('(isEmpty == true) implies size to be zero', async () => {
      expect(await cache.isEmpty()).to.equal(true);
      expect(await cache.size()).to.equal(0);
    });

    it('(isEmpty == false) implies size to be greater than zero', async () => {
      await cache.put('ca', states.ca);

      expect(await cache.isEmpty()).to.equal(false);
      expect(await cache.size()).to.equal(1);
    });

  }); // #isEmpty


  describe('#size', function() {

    it('should be zero on an empty cache', async () => {
      expect(await cache.size()).to.equal(0);
    });

    it('if size is zero isEmpty must be true', async () => {
      expect(await cache.size()).to.equal(0);
      expect(await cache.isEmpty()).to.equal(true);
    });

    it('should be non zero after a put', async () => {
      await cache.put('ca', states.ca);

      expect(await cache.size()).to.be.above(0);
    });

    it('if size is non zero isEmpty must be false', async () => {
      await cache.put('ca', states.ca);

      expect(await cache.size()).to.equal(1);
      expect(await cache.isEmpty()).to.equal(false);
    });

  }); // #size


  describe('#put', function() {

    it('put should increment size', async () => {
      let sz = await cache.size();
      await cache.put('ca', states.ca);

      expect(await cache.size()).to.equal(sz + 1);
    });

    it('put should cause isEmpty to be false', async () => {
      await cache.put('ny', states.ny);

      expect(await cache.isEmpty()).to.equal(false);
    });

    it('put on a non existent mapping should return null', async () => {
      const prev = await cache.put('ny', states.ny);

      expect(await cache.size()).to.equal(1);
      expect(prev).to.equal(null);
    });

    it('put on an existing mapping should return previous value', async () => {
      await cache.put('ca', states.ca);
      const prev = await cache.put('ca', states.ny);

      expect(await cache.size()).to.equal(1);
      expect(prev).to.eql(states.ca);
      expect(await cache.get('ca')).to.eql(states.ny);
    });

    it('check put with a primitive key', async () => {
      await cache.put(123, states.ny);

      expect(await cache.size()).to.equal(1);
      expect(await cache.isEmpty()).to.equal(false);
      expect(await cache.get(123)).to.eql(states.ny);
    });

    it('check put with an object key', async () => {
      await cache.put(states.ca, states.ca);

      expect(await cache.size()).to.equal(1);
      expect(await cache.isEmpty()).to.equal(false);
      expect(await cache.get(states.ca)).to.eql(states.ca);
    });

    it('put in a loop', async () => {
      for (let i = 0; i < 10; i++) {
        let key = {id: "id-" + i, linkId: {id: "id-" + (i*2)}}
        await cache.put(key, states.ca);

        expect(await cache.size()).to.equal(i+1);
        expect(await cache.get(key)).to.eql(states.ca);
      }
    });

  }); // #put


  describe('#get', function() {

    it('get on a empty cache should return null', async () => {
      expect(await cache.get(states.ca)).to.equal(null);
    });

    it('get on a non existent mapping should return null', async () => {
      await cache.put(123, states.ca);

      expect(await cache.get(states.ca)).to.equal(null);
    });

    it('get on an existing mapping should return that value', async () => {
      await cache.put(states.ca, states.ca);
      expect(await cache.get(states.ca)).to.eql(states.ca);
    });

    it('get with a primitive key', async () => {
      await cache.put(123, states.ca);
      expect(await cache.get(123)).to.eql(states.ca);
    });

    it('get with a complex key', async () => {
      await cache.put(states.ca, states.ca);

      expect(await cache.get(states.ca)).to.eql(states.ca);
      expect(await cache.get(states.ny)).to.equal(null);
    });

    it('multiple put and get on a loop', async () => {
      for (let i = 0; i < 10; i++) {
        let key = {id: "id-" + i, linkId: {id: "id-" + (i*2)}}
        await cache.put(key, states);

        expect(await cache.get(key)).to.eql(states);
        expect(await cache.size()).to.equal(i+1);
      }
    });

  }); // #get


});
