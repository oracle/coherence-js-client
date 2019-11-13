/* test/cache_test.js */

const chai            = require('chai');
const expect          = chai.expect;
const chaiAsPromised  = require("chai-as-promised");
chai.use(chaiAsPromised);

const Request     = require('../request.js');
const states      = require('./states.js');

describe('Request', function() {

  function toBuffer(obj) {
    return Buffer.from(JSON.stringify(obj));
  }

  this.timeout(15000);

  describe('#clear', function() {

    it('cannot create a clear request without cache name', async () => {
      expect(() => Request.clear()).to.throw('cache name cannot be null or undefined');
    })

    it('cannot create a clear request with null cache name', async () => {
      expect(() => Request.clear(null)).to.throw('cache name cannot be null or undefined');
    })

    it('cache name has to be a string', async () => {
      expect(() => Request.clear({key: "Persons"})).to.throw('cache name has to be a string type');
    })

    it('can create a clear request with a cache name', async () => {
      const get = Request.clear("States");
      const expected = {
        cache: "States"
      };

      expect(get).to.eql(expected);
    })

  }); // #clear


  describe('#containsEntry', function() {

    it('can create a containsEntry request from a simple key', async () => {
      const containsEntry = Request.containsEntry("States", "ca", states.ca);
      const expected = {
        cache: "States",
        format: "json",
        key: toBuffer("ca"),
        value: toBuffer(states.ca)
      };

      expect(containsEntry).to.eql(expected);
    })

    it('can create a containsEntry request from a complex key', async () => {
      const containsEntry = Request.containsEntry("States", states.ca, states.ny);
      const expected = {
        cache: "States",
        format: "json",
        key: toBuffer(states.ca),
        value: toBuffer(states.ny)
      };

      expect(containsEntry).to.eql(expected);
    })

  }); // #containsEntry


  describe('#containsKey', function() {

    it('can create a containsKey request from a simple key', async () => {
      const containsKey = Request.containsKey("States", "ca");
      const expected = {
        cache: "States",
        format: "json",
        key: toBuffer("ca")
      };

      expect(containsKey).to.eql(expected);
    })

    it('can create a containsEntry request from a complex key', async () => {
      const containsKey = Request.containsKey("States", states.ca);
      const expected = {
        cache: "States",
        format: "json",
        key: toBuffer(states.ca)
      };

      expect(containsKey).to.eql(expected);
    })

  }); // #containsEntry


  describe('#containsValue', function() {

    it('can create a containsValue request from a simple key', async () => {
      const containsValue = Request.containsValue("States", "ca", states.ca);
      const expected = {
        cache: "States",
        format: "json",
        key: toBuffer("ca"),
        value: toBuffer(states.ca)
      };

      expect(containsValue).to.eql(expected);
    })

    it('can create a containsEntry request from a complex key', async () => {
      const containsValue = Request.containsValue("States", states.ca, states.ny);
      const expected = {
        cache: "States",
        format: "json",
        key: toBuffer(states.ca),
        value: toBuffer(states.ny)
      };

      expect(containsValue).to.eql(expected);
    })

  }); // #containsValue


  describe('#isEmpty', function() {

    it('can create a clear request with a cache name', async () => {
      const isEmpty = Request.isEmpty("States");
      const expected = {
        cache: "States"
      };

      expect(isEmpty).to.eql(expected);
    })

  }); // #isEmpty


  describe('#get', function() {

    it('can create a get request from a simple key', async () => {
      const get = Request.get("States", "ca");
      const expected = {
        cache: "States",
        format: "json",
        key: toBuffer("ca")
      };

      expect(get).to.eql(expected);
    })

    it('can create a get request from a complex key', async () => {
      const get = Request.get("States", states.ca);
      const expected = {
        cache: "States",
        format: "json",
        key: toBuffer(states.ca)
      };

      expect(get).to.eql(expected);
    })

  }); // #get


  describe('#put', function() {

    it('can create a put request from a simple key', async () => {
      const put = Request.put("States", "ca", states.ca);
      const expected = {
        cache: "States",
        format: "json",
        key: toBuffer("ca"),
        value: toBuffer(states.ca)
      };

      expect(put).to.eql(expected);
    })

    it('can create a put request from a complex key', async () => {
      const put = Request.put("States", states.ca, states.ny);
      const expected = {
        cache: "States",
        format: "json",
        key: toBuffer(states.ca),
        value: toBuffer(states.ny)
      };

      expect(put).to.eql(expected);
    })

  }); // #put


  describe('#putIfAbsent', function() {

    it('can create a putIfAbsent request from a simple key', async () => {
      const putIfAbsent = Request.putIfAbsent("States", "ca", states.ca);
      const expected = {
        cache: "States",
        format: "json",
        key: toBuffer("ca"),
        value: toBuffer(states.ca)
      };

      expect(putIfAbsent).to.eql(expected);
    })

    it('can create a putIfAbsent request from a complex key', async () => {
      const putIfAbsent = Request.putIfAbsent("States", states.ca, states.ny);
      const expected = {
        cache: "States",
        format: "json",
        key: toBuffer(states.ca),
        value: toBuffer(states.ny)
      };

      expect(putIfAbsent).to.eql(expected);
    })

  }); // #putIfAbsent

  describe('#remove', function() {

    it('can create a remove request from a simple key', async () => {
      const remove = Request.remove("States", "ca");
      const expected = {
        cache: "States",
        format: "json",
        key: toBuffer("ca")
      };

      expect(remove).to.eql(expected);
    })

    it('can create a remove request from a complex key', async () => {
      const remove = Request.remove("States", states.ca);
      const expected = {
        cache: "States",
        format: "json",
        key: toBuffer(states.ca)
      };

      expect(remove).to.eql(expected);
    })

  }); // #remove


  describe('#removeMapping', function() {

    it('can create a removeMapping request from a simple key', async () => {
      const removeMapping = Request.removeMapping("States", "ca", states.ca);
      const expected = {
        cache: "States",
        format: "json",
        key: toBuffer("ca"),
        value: toBuffer(states.ca)
      };

      expect(removeMapping).to.eql(expected);
    })

    it('can create a removeMapping request from a complex key', async () => {
      const removeMapping = Request.removeMapping("States", states.ca, states.ny);
      const expected = {
        cache: "States",
        format: "json",
        key: toBuffer(states.ca),
        value: toBuffer(states.ny)
      };

      expect(removeMapping).to.eql(expected);
    })

  }); // #removeMapping


  describe('#replace', function() {

    it('can create a replace request from a simple key', async () => {
      const replace = Request.replace("States", "ca");
      const expected = {
        cache: "States",
        format: "json",
        key: toBuffer("ca")
      };

      expect(replace).to.eql(expected);
    })

    it('can create a replace request from a complex key', async () => {
      const replace = Request.replace("States", states.ca);
      const expected = {
        cache: "States",
        format: "json",
        key: toBuffer(states.ca)
      };

      expect(replace).to.eql(expected);
    })

  }); // #replace


  describe('#replaceMapping', function() {

    it('can create a replaceMapping request from a simple key', async () => {
      const replaceMapping = Request.replaceMapping("States", "ca", states.ca, states.ny);
      const expected = {
        cache: "States",
        format: "json",
        key: toBuffer("ca"),
        previousValue: toBuffer(states.ca),
        newValue: toBuffer(states.ny)
      };

      expect(replaceMapping).to.eql(expected);
    })

    it('can create a replaceMapping request from a complex key', async () => {
      const replaceMapping = Request.replaceMapping("States", states.ca, states.ny, states.ca);
      const expected = {
        cache: "States",
        format: "json",
        key: toBuffer(states.ca),
        previousValue: toBuffer(states.ny),
        newValue: toBuffer(states.ca)
      };

      expect(replaceMapping).to.eql(expected);
    })

  }); // #replaceMapping

  describe('#size', function() {

    it('can create a size request with a cache name', async () => {
      const size = Request.size("States");
      const expected = {
        cache: "States"
      };

      expect(size).to.eql(expected);
    })

  }); // #isEmpty

});
