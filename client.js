'use strict';

const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

/**
 * A NamedCacheClient as a client to a NamedCache wich is a Map that holds
 * resources shared among members of a cluster.
 *
 * All methods in this class return a Promise that eventually either resolves
 * to a value (as described in the NamedCache) or an error if any exception
 * occurs during the method invocation.
 */
module.exports = class NamedCacheClient {

  /**
   * Creates a NamedCacheClient for the specified cache. The options to be used.
   * The supported option values are:
   *  address: the address to connect to. Defaults to 'localhost:1408'
   *  ttl: the default time to live in milliseconds for the entries that are
           put in the cache. Defaults to zero
   *
   * @param cacheName the name of the cache
   * @param options   the options to be used. The supported option values are:
   *                  address: the address to connect to. Defaults to 'localhost:1408'
   *                  ttl: the default time to live in milliseconds. Defaults to zero
   */
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

  /**
   * Clears all the mappings in the cache.
   *
   * @return a Promise that eventually resolves (with an undefined value)
   */
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

  /**
   * Checks if the NamedCache is empty or not.
   *
   * @return a Promise that eventually resolves to true if the cache is empty;
   *         false otherwise
   */
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
   * Returns the value to which this map maps the specified key.
   *
   * @param key the key whose associated value is to be returned
   *
   * @return a Promise that will eventually resolve to the value that
   * is associated with the specified key.
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
          if (response.value && response.value.length > 0) {
            resolve(JSON.parse(Buffer.from(response.value)));
          }
          resolve(null);
        }
      });
    });
  }

  /**
   * Associates the specified value with the specified key in this map. If the
   * map previously contained a mapping for this key, the old value is replaced.
   *
   * @param key the key with which the specified value is to be associated
   * @param key the value to be associated with the specified key
   *
   * @return a Promise that will eventually resolve to the previous value that
   * was associated with the specified key.
   */
  put(key, value) {
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
          if (response.value && response.value.length > 0) {
            resolve(JSON.parse(Buffer.from(response.value)));
          }
          resolve(null);
        }
      });
    });
  }

  /**
   * Returns the number of key-value mappings in this map.
   *
   * @return a Promise that will eventually resolve to the number of key-value
   *         mappings in this map
   */
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
