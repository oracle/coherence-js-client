'use strict';

const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

const oneDay = 86400;

const noop = () => {}

/**
 * CoherenceConnect implements the necessary methods so that it can be used
 * by the express-session module as a session store.
 *
 * Internally, it talks to a gRPC service as defined in the coherence_session_store.proto.
 */
module.exports = class NamedCacheClient {

  constructor(cacheName, options = {}) {
    this.cacheName = cacheName;
    this.address = options.address || 'localhost:1408';
    this.options = options;

    const loadOptions = {
      keepCase: true,
      defaults: true,
      oneofs: true
    };

    const pkg = protoLoader.loadSync(__dirname + '/lib/services.proto', loadOptions);
    const cache_proto = grpc.loadPackageDefinition(pkg);
    this.client = new cache_proto.coherence.NamedCacheService(this.address, grpc.credentials.createInsecure());
  }

  clear() {
    const self = this;
    const request = {
      cache : self.cacheName
    }

    return new Promise((resolve, reject) => {
      self.client.clear(request, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  isEmpty() {
    const self = this;
    const request = {
      cache : self.cacheName
    }

    return new Promise((resolve, reject) => {
      self.client.isEmpty(request, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response.value);
        }
      });
    });
  }

  /**
   * Returns a Promise that will eventually resolve to the value that
   * is associated with the specified key.
   *
   * @param key the callback to be invoked on completion
   */
  get(key) {
    const self = this;
    const request = {
      cache : self.cacheName,
      format : "json",
      key   : Buffer.from(JSON.stringify(key))
    };

    return new Promise((resolve, reject) => {
      self.client.get(request, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response.value);
        }
      });
    });
  }

  /**
   * Returns a Promise that will eventually resolve to the value that
   * is associated with the specified key.
   *
   * @param key the callback to be invoked on completion
   */
  put(key, value, callback = noop) {
    const self = this;
    const request = {
      cache : self.cacheName,
      format : "json",
      key   : Buffer.from(JSON.stringify(key)),
      value : Buffer.from(JSON.stringify(value))
    };

    return new Promise((resolve, reject) => {
      self.client.put(request, (err, response) => {
        if (err) {
          reject(err);
        } else {
          console.log("** Got response.value: <" + JSON.stringify(response.value) + ">")
          if (response.value && response.value.length > 0) {
            resolve(JSON.parse(Buffer.from(response.value).toString()));
          }
          resolve(null);
        }
      });
    });
  }

  size() {
    const self = this;
    const request = {
      cache : self.cacheName
    }

    return new Promise((resolve, reject) => {
      self.client.size(request, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response.value);
        }
      });
    });
  }
}
