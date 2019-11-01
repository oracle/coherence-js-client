/* test/client_test.js */

const CacheClient = require('../client.js');
const client      = new CacheClient("Persons");
const invClient   = new CacheClient("");

const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

describe('NamedCacheService', function() {

  this.timeout(30000);

  // describe('#clear', function() {
  //   it('## should call clear', (done) => {
  //     client.clear()
  //       .then(() => {
  //         done();
  //       })
  //       .catch(err => {
  //         done(err)
  //       })
  //   });
  // });

  // describe('#clear', function() {
  //   it('## should call clear', (done) => {
  //     client.clear()
  //       .then(() => {
  //         return client.size();
  //       })
  //       .then(sz => {
  //         expect(sz).to.equal(0);
  //         done();
  //       })
  //       .catch(err => {
  //         done(err)
  //       })
  //   });
  // });

  //
  // describe('#isEmpty', function() {
  //   it('should call isEmpty', (done) => {
  //     client.clear()
  //       .then(ignored => {
  //         return client.isEmpty();
  //       })
  //       .then(status => {
  //         expect(status).to.equal(true)
  //         return client.size();
  //       })
  //       .then(sz => {
  //         expect(sz).to.equal(0)
  //         done()
  //       })
  //     });
  //   });

  //
  //
  // describe('#size', function() {
  //
  //   let prevSize = 0;
  //   it('should call size', (done) => {
  //     client.size()
  //       .then(sz => {
  //         prevSize = sz;
  //         console.log("Prev size: " + prevSize)
  //         return client.isEmpty();
  //       })
  //       .then(e => {
  //         console.log("IS EMPTY: " + e)
  //         expect(e).to.equal(prevSize == 0)
  //         done();
  //       })
  //   });
  //
  // });
  //
  describe('#put', function() {

    const key = {k : 12345};

    it('should call put', (done) => {
      const person = {name: "Name-789", age: 10};
      const person2 = {name: "Name-123567", age: 100};
      client.put(key, person)
        .then(ignored => {
          return client.put(key, person2)
        })
        .then(prev => {
          expect(prev).to.equal(person);
          return client.put(key, person2)
        })
        .then(prev => {
          expect(prev).to.equal(person2);
          done();
        })
        .catch(err => {
          console.log("Error: " + err)
          done(err)
        })
      })

    });


  // describe('#get', function() {
  //
  //   const key = {k : 12345};
  //
  //   it('should call get', (done) => {
  //     const person = {name: "Name-123", age: 10};
  //     const person2 = {name: "Name-123567", age: 100};
  //     client.get(key)
  //       .then(prev => {
  //         expect(person).to.equal(prev);
  //         done();
  //       })
  //       .catch(err => {
  //         console.log("Error: " + err)
  //         done(err)
  //       })
  //   })
  //
  //
  // });

});
