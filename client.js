'use strict';

const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const RequestFactory = require('./request')

const StreamedCollection = require('./lib/StreamedCollection.js')

/**
 * A NamedCacheClient as a client to a NamedCache wich is a Map that
 * holds resources shared among members of a cluster.
 *
 * All methods in this class return a Promise that eventually either
 * resolves to a value (as described in the NamedCache) or an error
 * if any exception occurs during the method invocation.
 */
module.exports = class NamedCacheClient {

  /**
   * Creates a NamedCacheClient for the specified cache. The options
   * to be used. The supported option values are:
   *    address: the address to connect to. Defaults to 'localhost:1408'
   *    ttl:     the default time to live in milliseconds for the entries
   *             that are put in the cache. Defaults to zero.
   *
   * @param cacheName the name of the cache
   * @param options   the options to be used.
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

    const pkg = protoLoader.loadSync(
        __dirname + '/lib/services.proto', loadOptions);
    const cache_proto = grpc.loadPackageDefinition(pkg);
    this.client = new cache_proto.coherence.NamedCacheService(
                this.address, grpc.credentials.createInsecure());

    this.Request = new RequestFactory(this.cacheName);
  }

  getCacheName() {
    return this.cacheName;
  }

  /**
   * Clears all the mappings in the cache.
   *
   * @return a Promise that eventually resolves (with an undefined value)
   */
  clear() {
    const self = this;
    const request = this.Request.clear();

    return new Promise((resolve, reject) => {
      self.client.clear(request, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  } // clear()

  /**
   * Returns true if this cache contains a mapping for the specified key.
   *
   * @param key the key whose presence in this cache is to be tested
   * @param key the value expected to be associated with the specified key
   *
   * @return a Promise that eventually resolves to true if the mapping
   *         exists or false otherwise
   */
  containsEntry(key, value) {
    const self = this;
    const request = this.Request.containsEntry(key, value);

    return new Promise((resolve, reject) => {
      self.client.containsEntry(request, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response.value);
        }
      });
    });
  } // containsEntry()

  /**
   * Returns true if the specified key is mapped to some value in this cache.
   *
   * @param key the key whose presence in this cache is to be tested
   *
   * @return a Promise that eventually resolves to true if the key is mapped
   *         to some value or false otherwise
   */
  containsKey(key) {
    const self = this;
    const request = this.Request.containsKey(key);

    return new Promise((resolve, reject) => {
      self.client.containsKey(request, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response.value);
        }
      });
    });
  } // containsKey()

  /**
   * Returns true if the specified value is mapped to some key.
   *
   * @param value the value expected to be associated with some key
   *
   * @return a Promise that eventually resolves to true if a mapping
   *         exists or false otherwise
   */
  containsValue(key, value) {
    const self = this;
    const request = this.Request.containsValue(key, value);

    return new Promise((resolve, reject) => {
      self.client.containsValue(request, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response.value);
        }
      });
    });
  } // containsValue()

  /**
   * Checks if this cache is empty or not.
   *
   * @return a Promise that eventually resolves to true if the cache is empty;
   *         false otherwise
   */
  isEmpty() {
    const self = this;
    const request = this.Request.isEmpty();

    return new Promise((resolve, reject) => {
      self.client.isEmpty(request, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response.value);
        }
      });
    });
  } // isEmpty()

  /**
   * Returns the value to which this cache maps the specified key.
   *
   * @param key the key whose associated value is to be returned
   *
   * @return a Promise that will eventually resolve to the value that
   * is associated with the specified key.
   */
  get(key) {
    const self = this;
    const request = this.Request.get(key);

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
  } // get()

  /**
   * Associates the specified value with the specified key in this map. If the
   * map previously contained a mapping for this key, the old value is replaced.
   *
   * @param key the key with which the specified value is to be associated
   * @param value the value to be associated with the specified key
   * @param ttl  the expiry time in millis
   *
   * @return a Promise that will eventually resolve to the previous value that
   * was associated with the specified key.
   */
  put(key, value, ttl) {
    const self = this;
    const request = this.Request.put(key, value, ttl);

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
  } // put()

  /**
   * Associates the specified value with the specified key in this map only if the
   * cache doe not contain any mapping for the specified key.
   *
   * @param key the key with which the specified value is to be associated
   * @param value the value to be associated with the specified key
   * @param ttl  the expiry time in millis
   *
   * @return a Promise that will eventually resolve to the previous value that
   * was associated with the specified key.
   */
  putIfAbsent(key, value, ttl) {
    const self = this;
    const request = this.Request.putIfAbsent(key, value, ttl);

    return new Promise((resolve, reject) => {
      self.client.putIfAbsent(request, (err, response) => {
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
  } // putIfAbsent()


  /**
   * Remove the value to which this cache maps the specified key.
   *
   * @param key the key whose associated value is to be removed
   *
   * @return a Promise that will eventually resolve to the value that
   * is associated with the specified key.
   */
  remove(key) {
    const self = this;
    const request = this.Request.remove(key);

    return new Promise((resolve, reject) => {
      self.client.remove(request, (err, response) => {
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
  } // remove()


  /**
   * Remove the mapping only if the cache contains the specified mapping.
   *
   * @param key the key whose associated value is to be removed
   * @param value the value that must be associated with the specified key
   *
   * @return a Promise that will eventually resolve to true if the specifiedf
   *         mapping exists in the cache; false otherwise
   */
  removeMapping(key, value) {
    const self = this;
    const request = this.Request.removeMapping(key, value);

    return new Promise((resolve, reject) => {
      self.client.removeMapping(request, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response.value);
        }
      });
    });
  } // removeMapping()


  /**
   * Replace the entry for the specified key only if it is currently
   * mapped to some value.
   *
   * @param key the key whose associated value is to be removed
   *
   * @return a Promise that will eventually resolve to the value that
   * is associated with the specified key.
   */
  replace(key) {
    const self = this;
    const request = this.Request.replace(key);

    return new Promise((resolve, reject) => {
      self.client.replace(request, (err, response) => {
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
  } // replace()

  /**
   * Replace the mapping for the specified key only if currently mapped
   * to the specified value.
   *
   * @param key the key whose associated value is to be removed
   * @param value the current value that must be associated with the specified key
   * @param newValue the new value that to be associated with the specified key
   *
   * @return a Promise that will eventually resolve to true if the specifiedf
   *         mapping exists in the cache; false otherwise
   */
  replaceMapping(key, value, newValue) {
    const self = this;
    const request = this.Request.replaceMapping(key, value, newValue);

    return new Promise((resolve, reject) => {
      self.client.replaceMapping(request, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response.value);
        }
      });
    });
  } // replaceMapping()

  /**
   * Returns the number of key-value mappings in this map.
   *
   * @return a Promise that will eventually resolve to the number of key-value
   *         mappings in this map
   */
  size() {
    const self = this;
    const request = this.Request.size();

    return new Promise((resolve, reject) => {
      self.client.size(request, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response.value);
        }
      });
    });
  } // size()


  /**
   * Return the key-value mappings in this cache.
   *
   * @return a StreamedSet that can be iterated. Each element in the
   *         Set will be a CacheEntry from which the key and value
   *         can be obtained using (key() and value()) methods.
   */
  entrySet() {
    return new StreamedCollection.EntrySet(this.cacheName, this, this.client);
  } // entrySet()


  /**
   * Return the values in this cache.
   *
   * @return a StreamedSet that can be iterated. Each element in the
   *         Set will be a CacheEntry from which the value
   *         can be obtained using (value()) method.
   */
  values() {
    return new StreamedCollection.ValuesSet(this.cacheName, this, this.client);
  } // entrySet()

}
