const RequestFactory = require('../request')


class StreamedCollection
  extends Set {

  constructor(cache) {
    super();
    this.cache = cache;
    this.pageAdvancer = new PageAdvancer(this);
  }

  add(value) {
    throw new Error('add not supported');
  }

  clear() {
    super.clear();
    return this.cache.clear();
  }

  delete(key) {
    super.delete(key);
    return this.cache.remove(key);
  }

  size() {
    return this.cache.size();
  }

  /**
   * Sync iterator.
   */
  [Symbol.asyncIterator]() {
    const self = this;
    return {
      next: () => self.pageAdvancer.nextData()
    }
  }

}

class EntrySet extends StreamedCollection {

  constructor(cacheName, cache, grpcClient) {
    super(cache);
    this.Request = new RequestFactory(cacheName);
    this.grpcClient = grpcClient;
  }

  has(key) {
    return super.has(key) || this.cache.containsKey(key);
  }

  retrieveNextPage(cookie) {
    return this.grpcClient.nextEntrySetPage(this.Request.page(cookie));
  }

  handle(entry) {
    return {
      value: {
        get key() { return JSON.parse(Buffer.from(entry.key)); },
        get value() { return JSON.parse(Buffer.from(entry.value)); }
      },
      done: false
    }
  }

}


class ValuesSet extends StreamedCollection {

  constructor(cacheName, cache, grpcClient) {
    super(cache);
    this.Request = new RequestFactory(cacheName);
    this.grpcClient = grpcClient;
  }

  has(key) {
    return super.has(key) || this.cache.containsKey(key);
  }

  retrieveNextPage(cookie) {
    return this.grpcClient.nextEntrySetPage(this.Request.page(cookie));
  }

  handle(entry) {
    return {
      value: {
        get value() { return JSON.parse(Buffer.from(entry.value)); }
      },
      done: false
    }
  }

}

class PageAdvancer {

  constructor(handler) {
    this.handler = handler;
    this.exhausted = false;
    this.data = [];
    this.cookie = null;
  }

  async next() {
    const self = this;
    if (self.data.length == 0) {
      if (!self.exhausted) {
        self.data = await self.loadNextPage();
        return self.next();
      } else {
        return new Promise((resolve, reject) => {
          resolve({done: true})
        });
      }
    } else {
      return new Promise((resolve, reject) => {
        resolve(self.data.shift())
      });
    }
  }

  nextData() {
    return this.next();
  }

  loadNextPage() {
    const self = this;

    return new Promise((resolve, reject) => {
      const call = self.handler.retrieveNextPage(self.cookie);

      let firstEntry = true;
      let data = [];

      call.on('data', function (entry) {
        if (firstEntry) {
          firstEntry = false;
          self.cookie = entry.cookie;
        } else {
          delete entry.cookie;
          data.push(self.handler.handle(entry));
        }
      });

      call.on('end', function () {
        self.exhausted = (self.cookie == null || self.cookie.length == 0);
        resolve(data);
      });

      call.on('error', function (e) {
        console.log("Error: " + err);
        reject(err);
      });

      call.on('status', function (status) {
        // process status
      });

    });
  }

}


module.exports = {
  EntrySet, ValuesSet
}
