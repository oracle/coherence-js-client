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


  describe('#clear', function () {

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


  describe('#containsEntry', function () {

    it('containsEntry on an empty map should return false', async () => {
      expect(await cache.containsEntry("ca", states.ca)).to.equal(false);
    });

    it('containsEntry on a non existent mapping should return false', async () => {
      await cache.put("ny", states.ny);
      expect(await cache.containsEntry("ca", states.ca)).to.equal(false);
    });

    it('containsEntry on an existing mapping should return true', async () => {
      await cache.put("ca", states.ca);
      expect(await cache.containsEntry("ca", states.ca)).to.equal(true);
    });


    it('containsEntry on an existing mapping with complex key should return true', async () => {
      await cache.put(states.ca, states.ca);
      expect(await cache.containsEntry(states.ca, states.ca)).to.equal(true);
    });

  }); // #containsEntry


  describe('#containsKey', function () {

    it('containsKey on an empty map should return false', async () => {
      expect(await cache.containsKey("ca")).to.equal(false);
    });

    it('containsKey on a non existent mapping should return false', async () => {
      await cache.put("ny", states.ny);
      expect(await cache.containsKey("ca")).to.equal(false);
    });

    it('containsKey on an existing mapping should return true', async () => {
      await cache.put("ca", states.ca);
      expect(await cache.containsKey("ca")).to.equal(true);
    });


    it('containsKey on an existing mapping with complex key should return true', async () => {
      await cache.put(states.ca, states.ca);
      expect(await cache.containsKey(states.ca)).to.equal(true);
    });

  }); // #containsKey


  describe('#containsValue', function () {

    it('containsValue on an empty map should return false', async () => {
      expect(await cache.containsValue("ca", states.ca)).to.equal(false);
    });

    it('containsValue on a non existent mapping should return false', async () => {
      await cache.put("ny", states.ny);
      expect(await cache.containsValue(states.ca)).to.equal(false);
    });

    it('containsValue on an existing mapping should return true', async () => {
      await cache.put("ca", states.ca);
      expect(await cache.containsValue(states.ca)).to.equal(true);
    });

    it('containsValue on an existing mapping with complex key should return true', async () => {
      await cache.put(states.ca, states.ca);
      expect(await cache.containsValue(states.ca)).to.equal(true);
    });

    it('containsValue on a non existent mapping with complex key should return false', async () => {
      await cache.put(states.ca, states.ca);
      expect(await cache.containsValue(states.ny)).to.equal(false);
    });

  }); // #containsValue


  describe('#get', function () {

    it('get on an empty cache should return null', async () => {
      expect(await cache.get(states.ca)).to.equal(null);
    });

    it('get on a non existent mapping should return null', async () => {
      await cache.put(123, states.ca);

      expect(await cache.get(states.ca)).to.equal(null);
    });

    it('get on an existing mapping should return that value', async () => {
      await cache.put(states.ca, states.ca);
      expect(await cache.size()).to.equal(1);
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
        let key = {
          id: "id-" + i,
          linkId: {
            id: "id-" + (i * 2)
          }
        }
        await cache.put(key, states);

        expect(await cache.get(key)).to.eql(states);
        expect(await cache.size()).to.equal(i + 1);
      }
    });

  }); // #get


  describe('#getOrDefault', function () {

    it('getOrDefault on an empty cache should return defaultValue', async () => {
      expect(await cache.getOrDefault('abc', states.ca)).to.eql(states.ca);
    });

    it('getOrDefault on a non existent mapping should return null', async () => {
      await cache.put(123, states.ca);

      expect(await cache.getOrDefault('xyz', states.ca)).to.eql(states.ca);
    });

    it('getOrDefault on an existing mapping should return that value', async () => {
      await cache.put(states.ca, states.ca);
      expect(await cache.size()).to.equal(1);
      expect(await cache.getOrDefault(states.ca, states.ny)).to.eql(states.ca);
    });

    it('getOrDefault with a primitive key', async () => {
      await cache.put(123, states.ca);
      expect(await cache.getOrDefault(123, states.ny)).to.eql(states.ca);
    });

    it('getOrDefault with a complex key', async () => {
      await cache.put(123, states.ca);

      expect(await cache.getOrDefault(states.ca, states.ny)).to.eql(states.ny);
      expect(await cache.get(states.ny)).to.equal(null);
    });

  }); // #getOrDefault

  describe('#isEmpty', function () {

    it('after clear isEmpty should be true', async () => {
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


  describe('#put', function () {

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
        let key = {
          id: "id-" + i,
          linkId: {
            id: "id-" + (i * 2)
          }
        }
        await cache.put(key, states.ca);

        expect(await cache.size()).to.equal(i + 1);
        expect(await cache.get(key)).to.eql(states.ca);
      }
    });

  }); // #put


  describe('#putIfAbsent', function () {

    it('putIfAbsent on empty cache should return null', async () => {
      let sz = await cache.size();
      await cache.putIfAbsent('ca', states.ca);

      expect(await cache.get('ca')).to.eql(states.ca);
    });

    it('putIfAbsent  on empty cache should cause isEmpty to be false', async () => {
      await cache.putIfAbsent('ny', states.ny);

      expect(await cache.isEmpty()).to.equal(false);
    });

    it('putIfAbsent on a non existent mapping should return null', async () => {
      const prev = await cache.putIfAbsent('ny', states.ny);

      expect(await cache.size()).to.equal(1);
      expect(prev).to.equal(null);
      expect(await cache.get('ny')).to.eql(states.ny);
    });

    it('putIfAbsent on an existing mapping should return previous value', async () => {
      await cache.put('ca', states.ca);
      const prev = await cache.putIfAbsent('ca', states.ny);

      expect(await cache.size()).to.equal(1);
      expect(prev).to.eql(states.ca);
      expect(await cache.get('ca')).to.eql(states.ca);
    });

    it('check putIfAbsent with an object key', async () => {
      await cache.putIfAbsent(states.ca, states.ca);

      expect(await cache.size()).to.equal(1);
      expect(await cache.isEmpty()).to.equal(false);
      expect(await cache.get(states.ca)).to.eql(states.ca);
    });

    it('putIfAbsent in a loop', async () => {
      for (let i = 0; i < 10; i++) {
        let key = {
          id: "id-" + i,
          linkId: {
            id: "id-" + (i * 2)
          }
        }
        await cache.putIfAbsent(key, states.ca);

        expect(await cache.size()).to.equal(i + 1);
        expect(await cache.get(key)).to.eql(states.ca);
      }
    });

  }); // #putIfAbsent


  describe('#remove', function () {

    it('remove on an empty cache should return null', async () => {
      expect(await cache.remove(states.ca)).to.equal(null);
    });

    it('remove on a non existent mapping should return null', async () => {
      await cache.put(123, states.ca);

      expect(await cache.remove('abc')).to.equal(null);
    });

    it('remove on an existing mapping should return that value', async () => {
      await cache.put(states.ca, states.ca);
      expect(await cache.remove(states.ca)).to.eql(states.ca);
    });

    it('remove with a primitive key', async () => {
      await cache.put(123, states.ca);
      expect(await cache.remove(123)).to.eql(states.ca);
    });

    it('remove with a complex key', async () => {
      await cache.put(states.ca, states.ca);

      expect(await cache.remove(states.ca)).to.eql(states.ca);
      expect(await cache.remove(states.ny)).to.equal(null);
    });

    it('multiple put and remove on a loop', async () => {
      for (let i = 0; i < 10; i++) {
        let key = {
          id: "id-" + i,
          link: {
            id: "id-" + (i * 2)
          }
        };
        await cache.put(key, states);
      }

      for (let i = 0; i < 10; i++) {
        expect(await cache.size()).to.equal(10 - i);

        let key = {
          id: "id-" + i,
          link: {
            id: "id-" + (i * 2)
          }
        };
        expect(await cache.remove(key)).to.eql(states);
        expect(await cache.size()).to.equal(10 - i - 1);
      }
    });

  }); // #remove


  describe('#removeMapping', function () {

    it('removeMapping on empty cache should return false', async () => {
      expect(await cache.removeMapping('ca', states.ca)).to.equal(false);
    });

    it('removeMapping on a non existent mapping should return false', async () => {
      await cache.put('ny', states.ny);
      expect(await cache.removeMapping('ny', states.ca)).to.equal(false);

      expect(await cache.size()).to.equal(1);
      expect(await cache.get('ny')).to.eql(states.ny);
    });

    it('removeMapping on an existing mapping should return true', async () => {
      await cache.put('ny', states.ny);
      expect(await cache.removeMapping('ny', states.ny)).to.equal(true);

      expect(await cache.size()).to.equal(0);
      expect(await cache.get('ny')).to.equal(null);
    });

    it('check removeMapping with an object key', async () => {
      await cache.put(states.ca, states.ca);
      expect(await cache.removeMapping(states.ca, states.ca)).to.equal(true);

      expect(await cache.size()).to.equal(0);
      expect(await cache.get(states.ca)).to.equal(null)
    });

    it('removeMapping in a loop', async () => {
      for (let i = 0; i < 10; i++) {
        let key = {
          id: "id-" + i,
          link: {
            id: "id-" + (i * 2)
          }
        };
        await cache.put(key, i % 2 == 0 ? states.ca : states.ny);
      }

      for (let i = 0; i < 10; i++) {
        expect(await cache.size()).to.equal(10 - i);

        let key = {
          id: "id-" + i,
          link: {
            id: "id-" + (i * 2)
          }
        };
        expect(await cache.removeMapping(key, i % 2 == 0 ? states.ca : states.ny))
          .to.equal(true);
        expect(await cache.size()).to.equal(10 - i - 1);
      }
    });

  }); // #putIfAbsent


  describe('#replace', function () {

    it('replace on an empty cache should return null', async () => {
      expect(await cache.replace('abc', states.ca)).to.equal(null);
    });

    it('replace on a non existent mapping should return null', async () => {
      await cache.put(123, states.ca);

      expect(await cache.replace('abc', states.ca)).to.equal(null);
    });

    it('replace on an existing mapping should return that value', async () => {
      await cache.put(states.ca, states.ca);
      expect(await cache.replace(states.ca, 'abc')).to.eql(states.ca);
      expect(await cache.get(states.ca)).to.eql('abc');
    });

    it('replace with a primitive key', async () => {
      await cache.put(123, states.ca);
      expect(await cache.replace(123, states.ny)).to.eql(states.ca);
    });

    it('replace with a complex key', async () => {
      await cache.put(states.ca, states.ca);

      expect(await cache.replace(states.ca, states.ny)).to.eql(states.ca);
      expect(await cache.get(states.ca)).to.eql(states.ny);
    });

    it('multiple put and replace on a loop', async () => {
      for (let i = 0; i < 10; i++) {
        let key = {
          id: "id-" + i,
          link: {
            id: "id-" + (i * 2)
          }
        };
        let value = {
          value: "id-" + i,
          link: {
            value: "id-" + (i * 2)
          }
        };
        await cache.put(key, value);
      }

      for (let i = 0; i < 10; i++) {
        expect(await cache.size()).to.equal(10);

        let key = {
          id: "id-" + i,
          link: {
            id: "id-" + (i * 2)
          }
        };
        let value = {
          value: "id-" + i,
          link: {
            value: "id-" + (i * 2)
          }
        };
        expect(await cache.replace(key, 'abc')).to.eql(value);
        expect(await cache.size()).to.equal(10);
      }
    });

  }); // #replace


  describe('#replaceMapping', function () {

    it('replaceMapping on empty cache should return false', async () => {
      expect(await cache.replaceMapping('ca', states.ca, states.ny)).to.equal(false);
    });

    it('replaceMapping on a non existent mapping should return false', async () => {
      await cache.put('ny', states.ny);
      expect(await cache.replaceMapping('ny', states.ca, states.ny)).to.equal(false);

      expect(await cache.size()).to.equal(1);
      expect(await cache.get('ny')).to.eql(states.ny);
    });

    it('replaceMapping on an existing mapping should return true', async () => {
      await cache.put('ny', states.ny);
      expect(await cache.get('ny')).to.eql(states.ny);

      expect(await cache.replaceMapping('ny', states.ny, states.ca)).to.equal(true);

      expect(await cache.size()).to.equal(1);
      expect(await cache.get('ny')).to.eql(states.ca);
    });

    it('check replaceMapping with an object key', async () => {
      await cache.put(states.ca, states.ca);
      expect(await cache.replaceMapping(states.ca, states.ca, states.ny)).to.equal(true);

      expect(await cache.size()).to.equal(1);
      expect(await cache.get(states.ca)).to.eql(states.ny)
    });

    it('replaceMapping in a loop', async () => {
      for (let i = 0; i < 10; i++) {
        let key = {
          id: "id-" + i,
          link: {
            id: "id-" + (i * 2)
          }
        };
        let value = {
          value: "id-" + i,
          link: {
            value: "id-" + (i * 2)
          }
        };
        await cache.put(key, value);
      }

      for (let i = 0; i < 10; i++) {
        expect(await cache.size()).to.equal(10);

        let key = {
          id: "id-" + i,
          link: {
            id: "id-" + (i * 2)
          }
        };
        let value = {
          value: "id-" + i,
          link: {
            value: "id-" + (i * 2)
          }
        };
        let newValue = {
          newValue: "new-id-" + i,
          link: {
            value: "id-" + (i * 2)
          }
        };
        expect(await cache.replaceMapping(key, value, newValue)).to.equal(true);
        expect(await cache.size()).to.equal(10);
        expect(await cache.get(key)).to.eql(newValue);
      }
    });

  }); // #putIfAbsent



  describe('#size', function () {

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

  const func = function (a, b) {
    const w = 0.2;

    return a + w * b;
  }



});