import { NamedCacheClient } from "./named_cache_client";
import { BytesValue } from "google-protobuf/google/protobuf/wrappers_pb";
import { EntryResult, PageRequest } from "./proto/messages_pb";
import { ClientReadableStream } from "grpc";
import { Serializer } from "../util/serializer";

interface IRemoteSet<T> {
    clear(): Promise<void>;
    delete(value: T): Promise<boolean>;
    has(value: T): Promise<boolean>;
    size(): Promise<number>;
    [Symbol.iterator](): IterableIterator<T>
}

class PagedSet<K, V, T>
    implements IRemoteSet<T> {

    namedCache: NamedCacheClient<K, V>;

    constructor(namedCache: NamedCacheClient<K, V>) {
        this.namedCache = namedCache;
    }

    add(value: T): this {
        throw new Error("add not allowed on paged set.");
    }

    clear(): Promise<void> {
        return this.namedCache.clear();
    }

    // Overridden
    delete(value: T): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    forEach(callbackfn: (value: T, value2: T, set: Set<T>) => void, thisArg?: any): void {
        throw new Error("only async iterator supported.");
    }

    // Overridden
    has(value: T): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    size(): Promise<number> {
        return this.namedCache.size();
    }

    [Symbol.iterator](): IterableIterator<T> {
        throw new Error("only async iterator supported.");
    }

    entries(): IterableIterator<[T, T]> {
        throw new Error("only async iterator supported.");
    }

    keys(): IterableIterator<T> {
        throw new Error("only async iterator supported.");
    }

    values(): IterableIterator<T> {
        throw new Error("only async iterator supported.");
    }

    [Symbol.toStringTag]: string;

}

/**
 * A collection that is backed by a NamedCache<K, V>. The 
 * values in the collection is of type either K or V. 
 * 
 * @param K - The key type of the named cache.
 * @param V - The value type of the named cache.
 * @param T - The type of entry in this collection.
 * @param R - The type of each entry in a Page. 
 * 
 */
class KeySet<K, V>
    extends PagedSet<K, V, K> {

    constructor(namedCache: NamedCacheClient<K, V>) {
        super(namedCache);
    }

    delete(key: K): Promise<boolean> {
        return new Promise((resolve, reject) => {
            return this.namedCache.remove(key)
                .then((v) => {
                    resolve(v != null || undefined);
                });
        });
    }

    has(key: K): Promise<boolean> {
        return this.namedCache.containsKey(key);
    }

    [Symbol.asyncIterator]() {
        return new PageAdvancer(new KeySetHelper(this.namedCache));
    }

    [Symbol.toStringTag]: string = "KeySet";
}

/**
 * A collection that is backed by a NamedCache<K, V>. Each 
 * entry in the set will be of type {@link MapEntry}
 * 
 * @param K - The key type of the named cache.
 * @param V - The value type of the named cache. 
 * 
 */
class EntrySet<K, V>
    extends PagedSet<K, V, NamedCacheEntry<K, V>> {

    constructor(namedCache: NamedCacheClient<K, V>) {
        super(namedCache);
    }

    delete(e: NamedCacheEntry<K, V>): Promise<boolean> {
        return this.namedCache.removeMapping(e.getKey(), e.getValue());
    }


    [Symbol.asyncIterator]() {
        return new PageAdvancer(new EntrySetHelper(this.namedCache));
    }

    [Symbol.toStringTag]: string = "EntrySet";

}

class ValueSet<K, V>
    extends PagedSet<K, V, V> {

    constructor(namedCache: NamedCacheClient<K, V>) {
        super(namedCache);
    }

    delete(e: V): Promise<boolean> {
        throw new Error("delete not allowed on paged value set.");
    }


    [Symbol.asyncIterator]() {
        return new PageAdvancer(new ValueSetHelper(this.namedCache));
    }

    [Symbol.toStringTag]: string = "ValueSet";

}

class EntrySetHelper<K, V>
    implements IStreamedDataHelper<EntryResult, NamedCacheEntry<K, V>> {

    private namedCache: NamedCacheClient<K, V>;

    constructor(namedCache: NamedCacheClient<K, V>) {
        this.namedCache = namedCache;
    }

    extractCookie(e: EntryResult): Cookie {
        return e.getCookie();
    }

    handleEntry(e: EntryResult): NamedCacheEntry<K, V> {
        return new NamedCacheEntry(e.getKey_asU8(), e.getValue_asU8());
    }

    loadNextPage(cookie: Cookie): ClientReadableStream<EntryResult> {
        return this.namedCache.nextEntrySetPage(cookie);
    }

}

class ValueSetHelper<K, V>
    implements IStreamedDataHelper<EntryResult, V> {

    private namedCache: NamedCacheClient<K, V>;

    constructor(namedCache: NamedCacheClient<K, V>) {
        this.namedCache = namedCache;
    }

    extractCookie(e: EntryResult): Cookie {
        return e.getCookie();
    }

    handleEntry(e: EntryResult): V {
        return Serializer.deserialize(e.getValue_asU8())
    }

    loadNextPage(cookie: Cookie): ClientReadableStream<EntryResult> {
        return this.namedCache.nextEntrySetPage(cookie);
    }

}

class KeySetHelper<K, V>
    implements IStreamedDataHelper<BytesValue, K> {

    private namedCache: NamedCacheClient<K, V>;

    constructor(namedCache: NamedCacheClient<K, V>) {
        this.namedCache = namedCache;
    }

    extractCookie(e: BytesValue): Cookie {
        return e.getValue();
    }

    handleEntry(e: BytesValue): K {
        return Serializer.deserialize(e.getValue_asU8())
    }

    loadNextPage(cookie: Cookie): ClientReadableStream<EntryResult> {
        return this.namedCache.nextKeySetPage(cookie);
    }

}


class PageAdvancer<K, V, R, T> {

    private exhausted: boolean;

    private data: R[];

    private current: number = -1;

    private cookie: Cookie;

    private helper: IStreamedDataHelper<R, T>;

    constructor(helper: IStreamedDataHelper<R, T>) {
        this.exhausted = false;
        this.helper = helper;
        this.data = [];
    }

    async next(): Promise<{ done?: boolean, value?: T }> {
        const self = this;
        if (self.data.length == 0) {
            if (!self.exhausted) {
                self.current = -1;
                self.data = await self.loadNextPage();
                return self.next();
            } else {
                return Promise.resolve({ done: true });
            }
        } else {
            return Promise.resolve({ value: self.helper.handleEntry(self.data.shift()) });
        }
    }

    private loadNextPage(): Promise<R[]> {
        const self = this;

        let firstEntry = true;
        let data: R[] = [];

        return new Promise((resolve, reject) => {
            const call = self.helper.loadNextPage(self.cookie);

            call.on('data', function (r: R) {
                if (firstEntry) {
                    firstEntry = false;
                    self.cookie = self.helper.extractCookie(r);
                } else {
                    // delete entry.cookie;
                    data.push(r);
                }
            });

            call.on('end', function () {
                self.exhausted = (self.cookie == null || self.cookie.length == 0);
                resolve(data);
            });

            call.on('error', function (err) {
                console.log("Error: " + err);
                reject(err);
            });

            call.on('status', function (status) {
                // process status
            });

        });
    }

}

interface IStreamedDataHelper<R, T> {

    extractCookie(raw: R): Cookie;

    handleEntry(raw: R | undefined): T;

    loadNextPage(req: Cookie): ClientReadableStream<R>;

}

// class AllEntries<K, V, R, T> {
//     private data: Set<R>;

//     private iter: IterableIterator<[R, R]>;

//     constructor(v: Set<R>) {
//         this.data = v;
//         this.iter = this.data.entries();
//     }

//     async next(): Promise<{ done?: boolean, value?: T }> {
//         const result: this.iter.next();

//         }
//         return new Promise.resolve({done: done, value: value});
//     }
// }


class NamedCacheEntry<K, V> {

    private key!: K;

    private value!: V;

    private keyBytes: Uint8Array;

    private valueBytes: Uint8Array;

    constructor(keyBytes: Uint8Array, valueBytes: Uint8Array) {
        this.keyBytes = keyBytes;
        this.valueBytes = valueBytes;
    }

    getKey(): K {
        if (!this.key) {
            this.key = Serializer.deserialize(this.keyBytes);
        }
        return this.key;
    }

    getValue(): V {
        if (!this.value) {
            this.value = Serializer.deserialize(this.valueBytes);
        }
        return this.value;    
    }
}

type Cookie = Uint8Array | string | undefined;

export { KeySet, EntrySet, ValueSet, IRemoteSet, NamedCacheEntry };
