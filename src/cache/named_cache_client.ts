/*
 * Copyright (c) 2019 Oracle and/or its affiliates. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { EventEmitter } from 'events';
import { BytesValue } from 'google-protobuf/google/protobuf/wrappers_pb';
import * as grpc from 'grpc';
import { ValueExtractor } from '../extractor/value_extractor';
import { Filter } from '../filter/filter';
import { Filters } from '../filter/filters';
import { MapEventFilter } from '../filter/map_event_filter';
import { EntryProcessor } from '../processor/entry_processor';
import { MapEventsManager } from '../util/map_events_manager';
import { MapListener } from '../util/map_listener';
import { Serializer } from '../util/serializer';
import { Util } from '../util/util';
import { NamedCache } from './named_cache';
import { Entry, Entry as GrpcEntry, EntryResult, IsEmptyRequest, SizeRequest } from './proto/messages_pb';
import { NamedCacheServiceClient } from './proto/services_grpc_pb';
import { MapEntry } from './query_map';
import { Comparator, RequestFactory } from './request_factory';
import { EntrySet, KeySet, NamedCacheEntry, RemoteSet, ValueSet } from './streamed_collection';
import { Session, SessionOptions } from './session';



/**
 * Class NamedCacheClient is a client to a NamedCache which is a Map that
 * holds resources shared among members of a cluster.
 *
 * All methods in this class return a Promise that eventually either
 * resolves to a value (as described in the NamedCache) or an error
 * if any exception occurs during the method invocation.
 * 
 * This class also extends EventEmitter and emits the following
 * events:
 * 1. 'truncated': When the underlying cache is truncated.
 * 2. 'destroyed': When the underlying cache is destroyed.
 * 
 */
export class NamedCacheClient<K = any, V = any>
    extends EventEmitter
    implements NamedCache<K, V> {

    private session: Session;

    /**
     * The name of the coherence NamedCache.
     */
    private cacheName: string;

    /**
     * The gRPC service client.
     */
    private client: NamedCacheServiceClient;

    /**
     * Request feactory. Used for internal purpose only.
     */
    private requestFactory: RequestFactory<K, V>;

    private mapEventsHandler: MapEventsManager<K, V>;

    private sessOpts: SessionOptions;

    /**
     * Create a new NamedCacheClient with the specified address and cache name.
     * The optional NamedCacheOptions can be used to specify additional 
     * properties.
     * 
     * @param address The gRPC server address to connect to.
     * @param cacheName The name of the coherence NamedCache.
     * @param options The optional NamedCacheOptions can be used to specify 
     *                additional properties.
     */
    constructor(cacheName: string, session: Session) {
        super();
        this.cacheName = cacheName;
        this.session = session;
        this.sessOpts = this.session.getSessionOptions();
        this.client = new NamedCacheServiceClient(
            '', /* address wont be used since channelOverride is mentioned below */
            session.getChannelCredentials(),
            { 'channelOverride': session.getChannel() });
        this.requestFactory = new RequestFactory(this.cacheName);
        this.mapEventsHandler = new MapEventsManager(this.cacheName, this.client, this);
    }

    getCacheName(): string {
        return this.cacheName;
    }

    addMapListener(listener: MapListener<K, V>, isLite?: boolean): Promise<void>;
    addMapListener(listener: MapListener<K, V>, key: K, isLite?: boolean): Promise<void>;
    addMapListener(listener: MapListener<K, V>, filter: MapEventFilter, isLite?: boolean): Promise<void>;
    addMapListener(listener: MapListener<K, V>, keyOrFilterOrLite?: MapEventFilter | K | boolean, isLite?: boolean): Promise<void> {
        let lite = false;

        if (isLite != undefined) {
            // three args invocation
            lite = isLite;
        }
        if (keyOrFilterOrLite) {
            if (keyOrFilterOrLite instanceof MapEventFilter) {
                return this.mapEventsHandler.registerFilterListener(listener, keyOrFilterOrLite, lite);
            } else if (typeof keyOrFilterOrLite === 'boolean') {
                // Two arg invocation.
                isLite = keyOrFilterOrLite;
                return this.mapEventsHandler.registerFilterListener(listener, null, lite);
            } else {
                return this.mapEventsHandler.registerKeyListener(listener, keyOrFilterOrLite, lite);
            }
        }

        // One arg invocation.
        return this.mapEventsHandler.registerFilterListener(listener, null, lite);
    }

    removeMapListener(listener: MapListener<K, V>): Promise<void>;
    removeMapListener(listener: MapListener<K, V>, key: K): Promise<void>;
    removeMapListener(listener: MapListener<K, V>, filter: MapEventFilter): Promise<void>;
    removeMapListener(listener: MapListener<K, V>, keyOrFilter?: MapEventFilter | K | null): Promise<void> {
        if (keyOrFilter) {
            return (keyOrFilter instanceof MapEventFilter)
                ? this.mapEventsHandler.removeFilterListener(listener, keyOrFilter)
                : this.mapEventsHandler.removeKeyListener(listener, keyOrFilter);
        }

        return this.mapEventsHandler.removeFilterListener(listener, null);
    }

    /**
     * Internal method to return RequestFactory.
     * 
     * @return An instance of RequestFactory.
     */
    getRequestFactory(): RequestFactory<K, V> {
        return this.requestFactory;
    }

    getNamedCacheServiceClient(): NamedCacheServiceClient {
        return this.client;
    }

    addIndex(extractor: ValueExtractor<any, any>, ordered?: boolean, comparator?: Comparator): Promise<void> {
        const self = this;
        const request = this.requestFactory.addIndex(extractor, ordered, comparator);
        return new Promise((resolve, reject) => {
            self.client.addIndex(request, this.callOptions(), (err: grpc.ServiceError | null) => {
                self.resolveValue(resolve, reject, err);
            });
        });
    }

    removeIndex<T, E>(extractor: ValueExtractor<T, E>): Promise<void> {
        const self = this;
        const request = this.requestFactory.removeIndex(extractor);
        return new Promise((resolve, reject) => {
            // REMOVE_INDEX NOT DEFINED in services.proto

            // self.client.removeIndex(request, (err: grpc.ServiceError | null) => {
            //     self.resolveValue(resolve, reject, err);
            // });
        });
    }

    /**
     * Clears all the mappings in the cache.
     *
     * @return A Promise that eventually resolves (with an undefined value).
     */

    clear(): Promise<void> {
        const self = this;
        return new Promise((resolve, reject) => {
            self.client.clear(self.requestFactory.clear(), this.callOptions(), (err: grpc.ServiceError | null) => {
                self.resolveValue(resolve, reject, err);
            });
        });
    }

    destroy(): Promise<void> {
        const self = this;
        return new Promise((resolve, reject) => {
            self.client.destroy(self.requestFactory.destroy(), this.callOptions(), (err: grpc.ServiceError | null) => {
                self.resolveValue(resolve, reject, err);
            });
        });
    }

    private resolveValue<T>(resolve: (value?: T | PromiseLike<T>) => void,
        reject: (reason?: any) => void,
        err?: grpc.ServiceError | null,
        fn?: () => T | undefined) {

        if (err) {
            reject(err);
        } else {
            return fn ? resolve(fn()) : resolve();
        }
    }

    /**
     * Returns true if this cache contains a mapping for the specified key.
     *
     * @param key The key whose presence in this cache is to be tested.
     * @param key The value expected to be associated with the specified key.
     *
     * @return A Promise that eventually resolves to true if the mapping
     *         exists or false otherwise.
     */
    containsEntry(key: K, value: V): Promise<boolean> {
        const self = this;
        return new Promise((resolve, reject) => {
            const request = self.requestFactory.containsEntry(key, value);
            self.client.containsEntry(request, this.callOptions(), (err, resp) => {
                self.resolveValue(resolve, reject, err, () => resp ? resp.getValue() : resp);
            });
        });
    }

    /**
     * Returns true if the specified key is mapped to some value in the cache.
     *
     * @param key The key whose presence in this cache is to be tested.
     *
     * @return A Promise that eventually resolves to true if the key is mapped
     *         to some value or false otherwise.
     */
    containsKey(key: K): Promise<boolean> {
        const self = this;
        const request = self.requestFactory.containsKey(key);
        return new Promise((resolve, reject) => {
            self.client.containsKey(request, this.callOptions(), (err, resp) => {
                self.resolveValue(resolve, reject, err, () => resp ? resp.getValue() : resp);
            });
        });
    }

    /**
     * Returns true if the specified value is mapped to some key.
     *
     * @param value The value expected to be associated with some key.
     *
     * @return A Promise that eventually resolves to true if a mapping
     *         exists or false otherwise.
     */
    containsValue(value: V): Promise<boolean> {
        const self = this;
        const request = this.requestFactory.containsValue(value);
        return new Promise((resolve, reject) => {
            self.client.containsValue(request, this.callOptions(), (err, resp) => {
                self.resolveValue(resolve, reject, err, () => resp ? resp.getValue() : resp);
            });
        });
    }


    /**
     * Returns a Set view of the keys contained in this map.
     *
     * @return a set view of the keys contained in this map
     */
    entrySet(): RemoteSet<MapEntry<K, V>>;
    entrySet(filter: Filter<any>, comp?: Comparator): Promise<Set<MapEntry<K, V>>>;
    entrySet(filter?: Filter<any>, comp?: Comparator): RemoteSet<MapEntry<K, V>> | Promise<Set<MapEntry<K, V>>> {
        const self = this;
        if (!filter) {
            return new EntrySet(this);
        }

        const set = new Set<MapEntry<K, V>>();
        const request = this.requestFactory.entrySet(filter, comp);
        const call = self.client.entrySet(request, this.callOptions());

        return new Promise((resolve, reject) => {
            call.on('data', function (e: GrpcEntry) {
                const entry = new NamedCacheEntry<K, V>(e.getKey_asU8(), e.getValue_asU8());
                set.add(entry);
            });
            call.on('end', () => resolve(set));
            call.on('error', (e) => {
                console.log("*** ERROR: " + e)
                reject(e)
            });
        });
    }


    /**
     * Returns the value to which this cache maps the specified key.
     *
     * @param key The key whose associated value is to be returned.
     *
     * @return A Promise that will eventually resolve to the value that
     *         is associated with the specified key.
     */
    get(key: K): Promise<V | null> {
        return this.getOrDefault(key, null);
    }

    /**
     * Get all the specified keys, if they are in the cache. For each key
     * that is in the cache, that key and its corresponding value will be
     * placed in the map that is returned by this method. The absence of
     * a key in the returned map indicates that it was not in the cache,
     * which may imply (for caches that can load behind the scenes) that
     * the requested data could not be loaded.
     * 
     * @returns A Promise that will eventually to a Map<K, V> containing
     *          the mappings for the specified keys. The absence of
     *          a key in the returned map indicates that it was not in 
     *          the cache, which may imply (for caches that can load 
     *          behind the scenes) that the requested data could not be 
     *          loaded.
     */
    getAll(keys: Iterable<K>): Promise<Map<K, V>> {
        const self = this;
        const result: Map<K, V> = new Map<K, V>();
        const call = self.client.getAll(self.requestFactory.getAll(keys), this.callOptions());
        return new Promise((resolve, reject) => {
            call.on('data', function (e: Entry) {
                const key = Serializer.deserialize(e.getKey_asU8());
                const value = Serializer.deserialize(e.getValue_asU8());
                result.set(key, value);
            });
            call.on('end', () => {
                resolve(result);
            });
            call.on('error', (e) => {
                console.log("*** getAll ERROR: " + e)
                reject(e)
            });
        });
    }

    /**
     * Returns the value to which the specified key is mapped, or
     * the specified defaultValue if this map contains no mapping for the key.
     */
    async getOrDefault(key: K, defaultValue: V | null): Promise<V | null> {
        const self = this;
        return new Promise((resolve, reject) => {
            self.client.get(self.requestFactory.get(key), this.callOptions(), (err, resp) => {
                if (resp && resp.getPresent()) {
                    self.resolveValue(resolve, reject, err, () => resp ? NamedCacheClient.toValue(resp.getValue_asU8()) : resp);
                } else {
                    resolve(defaultValue);
                }
            });
        });
    }

    /**
     * Invoke the passed EntryProcessor against the Entry specified by the
     * passed key, returning the result of the invocation.
     *
     * @param <R>       the type of value returned by the EntryProcessor
     * @param key       the key to process; it is not required to exist within
     *                  the Map
     * @param processor the EntryProcessor to use to process the specified key
     *
     * @return the result of the invocation as returned from the EntryProcessor
     */
    invoke<R>(key: K, processor: EntryProcessor<K, V, R>): Promise<R | null> {
        const self = this;
        return new Promise((resolve, reject) => {
            self.client.invoke(self.requestFactory.invoke(key, processor), (err, resp) => {
                if (err) {
                    console.log("** INVOKE ERR: " + err)
                    reject(err);
                } else {
                    self.resolveValue(resolve, reject, err, () => resp ? NamedCacheClient.toValue(resp.getValue_asU8()) : resp);
                }
            });
        });
    }

    /**
     * Invoke the passed EntryProcessor against the entries specified by the
     * passed keys, returning the result of the invocation for each.
     *
     * @param <R>       the type of value returned by the EntryProcessor
     * @param collKeys  the keys to process; these keys are not required to
     *                  exist within the Map
     * @param processor the EntryProcessor to use to process the specified keys
     *
     * @return a Map containing the results of invoking the EntryProcessor
     * against each of the specified keys
     */
    invokeAll<R = any>(processor: EntryProcessor<K, V, R>): Promise<Map<K, R>>;
    invokeAll<R = any>(keys: Iterable<K>, processor: EntryProcessor<K, V, R>): Promise<Map<K, R>>;
    invokeAll<R = any>(filter: Filter<V>, processor: EntryProcessor<K, V, R>): Promise<Map<K, R>>;
    invokeAll<R = any>(keysOrFilterOrProcessor: Iterable<K> | Filter<V> | EntryProcessor<K, V, R>, processor?: EntryProcessor<K, V, R>): Promise<Map<K, R>> {
        const self = this;
        let keysOrFilter: Iterable<K> | Filter;
        if (processor) {
            // Two args invocation
            if (keysOrFilterOrProcessor instanceof Filter) {
                keysOrFilter = keysOrFilterOrProcessor;
            } else if (Util.isIterableType(keysOrFilterOrProcessor)) {
                keysOrFilter = keysOrFilterOrProcessor;
            } else {
                throw new Error('invokeAll() takes only one processor as argument');
            }
        } else {
            // One arg (which is a EntryProcessor)
            keysOrFilter = Filters.always();
            processor = keysOrFilterOrProcessor as EntryProcessor;
        }

        const call = self.client.invokeAll(self.requestFactory.invokeAll(keysOrFilter, processor), this.callOptions());
        const result: Map<K, R> = new Map<K, R>();
        return new Promise((resolve, reject) => {
            call.on('data', function (e: Entry) {
                const key = Serializer.deserialize(e.getKey_asU8());
                const value = Serializer.deserialize(e.getValue_asU8());
                result.set(key, value);
            });
            call.on('end', () => resolve(result));
            call.on('error', (e) => {
                console.log("*** invokeAll ERROR: " + e)
                reject(e)
            });
        });
    }

    /**
     * Checks if this cache is empty or not.
     *
     * @return A Promise that eventually resolves to true if the cache is empty;
     *         false otherwise.
     */
    isEmpty(): Promise<boolean> {
        const self = this;
        return new Promise((resolve, reject) => {
            const request = new IsEmptyRequest();
            request.setCache(this.cacheName);
            self.client.isEmpty(request, this.callOptions(), (err, resp) => {
                self.resolveValue(resolve, reject, err, () => resp ? resp.getValue() : resp);
            });
        });
    }

    /**
     * Return a set view of the keys contained in this map for entries that 
     * satisfy the criteria expressed by the filter.
     * 
     * @remarks
     * Unlike the keySet() method, the set returned by this method may 
     * not be backed by the map, so changes to the set may not reflected 
     * in the map, and vice-versa.
     * 
     * @param filter     - The Filter object representing the criteria 
     *                     that the entries of this map should satisfy.
     * @param comparator - The Comparator object which imposes an ordering 
     *                     on entries in the indexed map; or null if the 
     *                     entries' values natural ordering should be used.
     */
    keySet(): RemoteSet<K>;
    keySet(filter: Filter<any>, comparator?: Comparator): Promise<Set<K>>;
    keySet(filter?: Filter<any>, comparator?: Comparator): RemoteSet<K> | Promise<Set<K>> {
        const self = this;
        if (!filter) {
            return new KeySet(this);
        }

        const set = new Set<K>();
        const request = this.requestFactory.keySet(filter);
        const call = self.client.keySet(request, this.callOptions());

        return new Promise((resolve, reject) => {
            call.on('data', function (r: BytesValue) {
                const k = Serializer.deserialize(r.getValue_asU8());
                if (k) {
                    set.add(k);
                }
            });
            call.on('end', () => resolve(set));
            call.on('error', (e) => {
                console.log("*** ERROR: " + e)
                reject(e)
            });
        });
    }

    /**
     * Associates the specified value with the specified key in this map. If the
     * map previously contained a mapping for this key, the old value is replaced.
     *
     * @param key The key with which the specified value is to be associated.
     * @param value The value to be associated with the specified key.
     * @param ttl The expiry time in millis.
     *
     * @return A Promise that will eventually resolve to the previous value that
     *         was associated with the specified key.
     */
    put(key: K, value: V, ttl?: number): Promise<V> {
        const self = this;
        return new Promise((resolve, reject) => {
            self.client.put(self.requestFactory.put(key, value, ttl), this.callOptions(), (err, resp) => {
                self.resolveValue(resolve, reject, err, () => resp ? NamedCacheClient.toValue(resp.getValue_asU8()) : resp);
            });
        });
    }

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
    putIfAbsent(key: K, value: V, ttl?: number): Promise<V> {
        const self = this;
        const request = self.requestFactory.putIfAbsent(key, value, ttl);
        return new Promise((resolve, reject) => {
            self.client.putIfAbsent(request, this.callOptions(), (err, resp) => {
                self.resolveValue(resolve, reject, err, () => resp ? NamedCacheClient.toValue(resp.getValue_asU8()) : resp);
            });
        });
    }

    /**
     * Remove the value to which this cache maps the specified key.
     *
     * @param key the key whose associated value is to be removed
     *
     * @return a Promise that will eventually resolve to the value that
     * is associated with the specified key.
     */
    remove(key: K): Promise<V> {
        const self = this;
        return new Promise((resolve, reject) => {
            self.client.remove(this.requestFactory.remove(key), this.callOptions(), (err, resp) => {
                self.resolveValue(resolve, reject, err, () => resp ? NamedCacheClient.toValue(resp.getValue_asU8()) : resp);
            });
        });
    }


    /**
     * Remove the mapping only if the cache contains the specified mapping.
     *
     * @param key the key whose associated value is to be removed
     * @param value the value that must be associated with the specified key
     *
     * @return a Promise that will eventually resolve to true if the specifiedf
     *         mapping exists in the cache; false otherwise
     */
    removeMapping(key: K, value: V): Promise<boolean> {
        const self = this;
        const request = this.requestFactory.removeMapping(key, value);
        return new Promise((resolve, reject) => {
            self.client.removeMapping(request, this.callOptions(), (err, resp) => {
                self.resolveValue(resolve, reject, err, () => resp ? resp.getValue() : resp);
            });
        });
    }


    /**
     * Replace the entry for the specified key only if it is currently
     * mapped to some value.
     *
     * @param key the key whose associated value is to be removed
     * @param value the value to be replaced.
     * 
     * @return a Promise that will eventually resolve to the value that
     * is associated with the specified key.
     */
    replace(key: K, value: V): Promise<V> {
        const self = this;
        const request = this.requestFactory.replace(key, value);
        return new Promise((resolve, reject) => {
            self.client.replace(request, this.callOptions(), (err, resp) => {
                self.resolveValue(resolve, reject, err, () => resp ? NamedCacheClient.toValue(resp.getValue_asU8()) : resp);
            });
        });
    }

    /**
     * Replace the mapping for the specified key with the newValue but only if 
     * currently mapped to the specified value.
     *
     * @param key the key whose associated value is to be removed
     * @param value the current value that must be associated with the specified key
     * @param newValue the new value that to be associated with the specified key
     *
     * @return a Promise that will eventually resolve to true if the specifiedf
     *         mapping exists in the cache; false otherwise
     */
    replaceMapping(key: K, value: V, newValue: V): Promise<boolean> {
        const self = this;
        const request = this.requestFactory.replaceMapping(key, value, newValue);

        return new Promise((resolve, reject) => {
            self.client.replaceMapping(request, this.callOptions(), (err, resp) => {
                self.resolveValue(resolve, reject, err, () => resp ? resp.getValue() : resp);
            });
        });
    }
    /**
     * Returns a Set view of the values contained in this cache.
     *
     * @return a set view of the values contained in this cache
     */
    /*
    keySet(): RemoteSet<K>;
    keySet(filter: Filter<V>, comparator?: Comparator): Promise<Set<K>>;
    keySet(filter?: Filter<any>, comparator?: Comparator): RemoteSet<K> | Promise<Set<K>> {
    */
    values(): RemoteSet<V>;
    values(filter: Filter<any>, comparator?: Comparator): Promise<Set<V>>;
    values(filter?: Filter<any>, comparator?: Comparator): RemoteSet<V> | Promise<Set<V>> {
        const self = this;
        if (!filter) {
            return new ValueSet(this);
        }

        const set = new Set<V>();
        const request = this.requestFactory.values(filter, comparator);
        const call = self.client.values(request, this.callOptions());

        return new Promise((resolve, reject) => {
            call.on('data', function (b: BytesValue) {
                set.add(Serializer.deserialize(b.getValue_asU8()));
            });
            call.on('end', () => resolve(set));
            call.on('error', (e) => {
                console.log("*** ERROR: " + e)
                reject(e)
            });
        });
    }

    nextEntrySetPage(cookie: Uint8Array | string | undefined): grpc.ClientReadableStream<EntryResult> {
        return this.client.nextEntrySetPage(this.requestFactory.pageRequest(cookie), this.callOptions());
    }

    nextKeySetPage(cookie: Uint8Array | string | undefined): grpc.ClientReadableStream<BytesValue> {
        return this.client.nextKeySetPage(this.requestFactory.pageRequest(cookie), this.callOptions());
    }


    /**
     * Returns the number of key-value mappings in this NAmedCache.
     *
     * @return A Promise that will eventually resolve to the number of key-value
     *         mappings in this cache.
     */
    size(): Promise<number> {
        return new Promise((resolve, reject) => {

            const request = new SizeRequest();
            request.setCache(this.cacheName);
            this.client.size(request, this.callOptions(), (err, resp) => {
                if (err || !resp) {
                    reject(err);
                } else {
                    resolve(resp.getValue());
                }
            });
        });
    }

    // Note: services.proto still uses SizeRequest
    truncate(): Promise<number> {
        return new Promise((resolve, reject) => {

            const request = new SizeRequest();
            request.setCache(this.cacheName);
            this.client.truncate(request, this.callOptions(), (err, resp) => {
                if (err || !resp) {
                    console.log("Truncate resulted in an error: " + err);
                    reject(err);
                } else {
                    resolve(resp.getValue());
                }
            });
        });
    }

    isActive(): Promise<boolean> {
        throw new Error("Method not implemented in services.proto");
    }

    release(): Promise<void> {
        throw new Error("Method not implemented in services.proto");
    }

    lock(key: any, cWait?: number | undefined): boolean {
        throw new Error("Method not implemented in services.proto");
    }

    unlock(key: any): boolean {
        throw new Error("Method not implemented in services.proto");
    }

    callOptions(): object {
        const options = {
            'deadline': Date.now() + this.sessOpts.requestTimeoutInMillis
        };

        return options;
    }

    static toValue<V>(value: Uint8Array): V {
        return (value && value.length > 0)
            ? Serializer.deserialize(value)
            : null;
    }
}


