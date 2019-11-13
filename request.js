const JSON_FORMAT = "json";

/**
 * A simple utility class to create typed requests.
 *
 * @type {module.Request}
 */

module.exports = class Request {

  static clear(cacheName) {
    return new BaseRequest(cacheName);
  }

  static containsEntry(cacheName, key, value) {
    return new RequestWithKeyAndValue(cacheName, key, value);
  }

  static containsKey(cacheName, key) {
    return new RequestWithKey(cacheName, key);
  }

  static containsValue(cacheName, key, value) {
    return new RequestWithKeyAndValue(cacheName, key, value);
  }

  static isEmpty(cacheName) {
    return new BaseRequest(cacheName);
  }

  static get(cacheName, key) {
    return new RequestWithKey(cacheName, key);
  }

  static put(cacheName, key, value, ttl) {
    const request = new RequestWithKeyAndValue(cacheName, key, value);
    if (typeof ttl !== 'undefined' || ttl != null) {
      request.ttl = ttl;
    }

    return request;
  }

  static putIfAbsent(cacheName, key, value, ttl) {
    const request = new RequestWithKeyAndValue(cacheName, key, value);
    if (typeof ttl !== 'undefined' || ttl != null) {
      request.ttl = ttl;
    }

    return request;
  }

  static remove(cacheName, key) {
    return new RequestWithKey(cacheName, key);
  }

  static removeMapping(cacheName, key, value) {
    return new RequestWithKeyAndValue(cacheName, key, value);
  }

  static replace(cacheName, key) {
    return new RequestWithKey(cacheName, key);
  }

  static replaceMapping(cacheName, key, value, newValue) {
    const request = new RequestWithKey(cacheName, key);
    request.previousValue = toBuffer(value);
    request.newValue = toBuffer(newValue);

    return request;
  }

  static size(cacheName) {
    return new BaseRequest(cacheName);
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


