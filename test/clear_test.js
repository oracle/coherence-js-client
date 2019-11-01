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

  describe('#clear', function() {
    it('## should call clear', (done) => {
      client.clear()
        .then(() => {
          done();
        })
        .catch(err => {
          done(err)
        })
    });
  });

  describe('#clear', function() {
    it('## should call clear', (done) => {
      client.clear()
        .then(() => {
          return client.size();
        })
        .then(sz => {
          expect(sz).to.equal(0);
          done();
        })
        .catch(err => {
          done(err)
        })
    });
  });

});
