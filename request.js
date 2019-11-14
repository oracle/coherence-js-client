const JSON_FORMAT = "json";

/**
 * A simple utility class to create typed requests.
 *
 * @type {module.Request}
 */

module.exports = class Request {

  constructor(cacheName) {
    this.cacheName = cacheName;
  }

  clear() {
    return new BaseRequest(this.cacheName);
  }

  containsEntry(key, value) {
    return new RequestWithKeyAndValue(this.cacheName, key, value);
  }

  containsKey(key) {
    return new RequestWithKey(this.cacheName, key);
  }

  containsValue(key, value) {
    return new RequestWithKeyAndValue(this.cacheName, key, value);
  }

  isEmpty() {
    return new BaseRequest(this.cacheName);
  }

  get(key) {
    return new RequestWithKey(this.cacheName, key);
  }

  put(key, value, ttl) {
    const request = new RequestWithKeyAndValue(this.cacheName, key, value);
    if (typeof ttl !== 'undefined' && ttl != null) {
      request.ttl = ttl;
    }

    return request;
  }

  putIfAbsent(key, value, ttl) {
    const request = new RequestWithKeyAndValue(this.cacheName, key, value);
    if (typeof ttl !== 'undefined' && ttl != null) {
      request.ttl = ttl;
    }

    return request;
  }

  remove(key) {
    return new RequestWithKey(this.cacheName, key);
  }

  removeMapping(key, value) {
    return new RequestWithKeyAndValue(this.cacheName, key, value);
  }

  replace(key) {
    return new RequestWithKey(this.cacheName, key);
  }

  replaceMapping(key, value, newValue) {
    const request = new RequestWithKey(this.cacheName, key);
    request.previousValue = toBuffer(value);
    request.newValue = toBuffer(newValue);

    return request;
  }

  size() {
    return new BaseRequest(this.cacheName);
  }

  page(cookie) {
    const request = new BaseRequest(this.cacheName);
    if (typeof cookie !== 'undefined' && cookie != null) {
      request.format = JSON_FORMAT;
      request.cookie = Buffer.alloc(0);
    }

    return request;
  }

}

class BaseRequest {
  constructor(cacheName) {
    if (typeof cacheName === 'undefined' || cacheName === null) {
      throw new Error('cache name cannot be null or undefined')
    }
    if (typeof cacheName !== 'string') {
      throw new Error('cache name has to be a string type')
    }

    this.cache = cacheName;
  }
}

class RequestWithKey extends BaseRequest {
  constructor(cacheName, key) {
    super(cacheName);
    if (typeof key === 'undefined' || key === null) {
      throw new Error('key cannot be null or undefined')
    }
    this.key = toBuffer(key);
    this.format = JSON_FORMAT;
  }
}

class RequestWithKeyAndValue extends RequestWithKey {
  constructor(cacheName, key, value) {
    super(cacheName, key);
    this.value = toBuffer(value);
  }
}


function toBuffer(obj) {
  return Buffer.from(JSON.stringify(obj));
}

function fromBuffer(buf) {
  return JSON.parse(Buffer.from(buf))
}


