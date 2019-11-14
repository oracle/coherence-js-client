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
      expect(() => new Request().clear()).to.throw('cache name cannot be null or undefined');
    })

    it('cannot create a clear request with null cache name', async () => {
      expect(() => new Request(null).clear()).to.throw('cache name cannot be null or undefined');
    })

    it('cache name has to be a string', async () => {
      expect(() => new Request({key: "Persons"}).clear()).to.throw('cache name has to be a string type');
    })

    it('can create a clear request with a cache name', async () => {
      const get = new Request("States").clear();
      const expected = {
        cache: "States"
      };

      expect(get).to.eql(expected);
    })

  }); // #clear


  describe('#containsEntry', function() {

    it('can create a containsEntry request from a simple key', async () => {
      const containsEntry = new Request("States").containsEntry("ca", states.ca);
      const expected = {
        cache: "States",
        format: "json",
        key: toBuffer("ca"),
        value: toBuffer(states.ca)
      };

      expect(containsEntry).to.eql(expected);
    })

    it('can create a containsEntry request from a complex key', async () => {
      const containsEntry = new Request("States").containsEntry(states.ca, states.ny);
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
      const containsKey = new Request("States").containsKey("ca");
      const expected = {
        cache: "States",
        format: "json",
        key: toBuffer("ca")
      };

      expect(containsKey).to.eql(expected);
    })

    it('can create a containsEntry request from a complex key', async () => {
      const containsKey = new Request("States").containsKey(states.ca);
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
      const containsValue = new Request("States").containsValue("ca", states.ca);
      const expected = {
        cache: "States",
        format: "json",
        key: toBuffer("ca"),
        value: toBuffer(states.ca)
      };

      expect(containsValue).to.eql(expected);
    })

    it('can create a containsEntry request from a complex key', async () => {
      const containsValue = new Request("States").containsValue(states.ca, states.ny);
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
      const isEmpty = new Request("States").isEmpty("States");
      const expected = {
        cache: "States"
      };

      expect(isEmpty).to.eql(expected);
    })

  }); // #isEmpty


  describe('#get', function() {

    it('can create a get request from a simple key', async () => {
      const get = new Request("States").get("ca");
      const expected = {
        cache: "States",
        format: "json",
        key: toBuffer("ca")
      };

      expect(get).to.eql(expected);
    })

    it('can create a get request from a complex key', async () => {
      const get = new Request("States").get(states.ca);
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
      const put = new Request("States").put("ca", states.ca);
      const expected = {
        cache: "States",
        format: "json",
        key: toBuffer("ca"),
        value: toBuffer(states.ca)
      };

      expect(put).to.eql(expected);
    })

    it('can create a put request from a complex key', async () => {
      const put = new Request("States").put(states.ca, states.ny);
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
      const putIfAbsent = new Request("States").putIfAbsent("ca", states.ca);
      const expected = {
        cache: "States",
        format: "json",
        key: toBuffer("ca"),
        value: toBuffer(states.ca)
      };

      expect(putIfAbsent).to.eql(expected);
    })

    it('can create a putIfAbsent request from a complex key', async () => {
      const putIfAbsent = new Request("States").putIfAbsent(states.ca, states.ny);
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
      const remove = new Request("States").remove("ca");
      const expected = {
        cache: "States",
        format: "json",
        key: toBuffer("ca")
      };

      expect(remove).to.eql(expected);
    })

    it('can create a remove request from a complex key', async () => {
      const remove = new Request("States").remove(states.ca);
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
      const removeMapping = new Request("States").removeMapping("ca", states.ca);
      const expected = {
        cache: "States",
        format: "json",
        key: toBuffer("ca"),
        value: toBuffer(states.ca)
      };

      expect(removeMapping).to.eql(expected);
    })

    it('can create a removeMapping request from a complex key', async () => {
      const removeMapping = new Request("States").removeMapping(states.ca, states.ny);
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
      const replace = new Request("States").replace("ca");
      const expected = {
        cache: "States",
        format: "json",
        key: toBuffer("ca")
      };

      expect(replace).to.eql(expected);
    })

    it('can create a replace request from a complex key', async () => {
      const replace = new Request("States").replace(states.ca);
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
      const replaceMapping = new Request("States").replaceMapping("ca", states.ca, states.ny);
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
      const replaceMapping = new Request("States").replaceMapping(states.ca, states.ny, states.ca);
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
      const size = new Request("States").size("States");
      const expected = {
        cache: "States"
      };

      expect(size).to.eql(expected);
    })

  }); // #size


  describe('#page', function() {

    it('can create a keySet request with a cache name', async () => {
      const page = new Request("States").page("States");
      const expected = {
        cache: "States",
        format: "json",
        cookie: Buffer.alloc(0)
      };

      expect(page).to.eql(expected);
    })

  }); // #isEmpty

});
