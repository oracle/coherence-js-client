// @ts-check
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

import * as grpc from 'grpc';

import { NamedCacheServiceClient, NamedCacheServiceService } from './proto/services_grpc_pb';
import {
    EntryResult,
    IsEmptyRequest,
    SizeRequest
} from './proto/messages_pb';

import { RequestFactory } from './request_factory';
import { IMap } from './i_map';
import { BytesValue } from 'google-protobuf/google/protobuf/wrappers_pb';
import { KeySet, EntrySet, NamedCacheEntry, IRemoteSet, ValueSet } from './streamed_collection';

/**
 * Class NamedCacheClient is a client to a NamedCache which is a Map that
 * holds resources shared among members of a cluster.
 *
 * All methods in this class return a Promise that eventually either
 * resolves to a value (as described in the NamedCache) or an error
 * if any exception occurs during the method invocation.
 */
export class NamedCacheClient<K, V>
    implements IMap<K, V> {

    /**
     * The name of the coherence NamedCache.
     */
    cacheName: string;

    /**
     * The gRPC service client.
     */
    client: NamedCacheServiceClient;

    /**
     * The optional NamedCacheOptions to use.
     */
    options?: NamedCacheOptions;

    /**
     * Request feactory. Used for internal purpose only.
     */
    reqFactory: RequestFactory<K, V>;

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
    constructor(cacheName: string, address?: string, options?: NamedCacheOptions) {
        this.cacheName = cacheName;
        this.options = options;
        this.client = new NamedCacheServiceClient(address || 'localhost:1408',
            grpc.credentials.createInsecure());
        this.reqFactory = new RequestFactory(this.cacheName);
    }

    /**
     * Internal method to return RequestFactory.
     * 
     * @return An instance of RequestFactory.
     */
    getRequestFactory(): RequestFactory<K, V> {
        return this.reqFactory;
    }

    getNamedCacheServiceClient(): NamedCacheServiceClient {
        return this.client;
    }

    /**
     * Clears all the mappings in the cache.
     *
     * @return A Promise that eventually resolves (with an undefined value).
     */

    clear(): Promise<void> {

        const clr = NamedCacheServiceService.clear;
        const self = this;
        return new Promise((resolve, reject) => {
            self.client.clear(self.reqFactory.clear(), (err: grpc.ServiceError | null) => {
                this.realizeValue(resolve, reject, err);
            });
        });
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
    containsEntry(key: K, value: V): Promise<Boolean> {
        const self = this;
        return new Promise((resolve, reject) => {
            const request = self.reqFactory.containsEntry(key, value);
            this.client.containsEntry(request, (err, resp) => {
                this.realizeValue(resolve, reject, err, resp);
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
        const request = self.reqFactory.containsKey(key);
        return new Promise((resolve, reject) => {
            this.client.containsKey(request, (err, resp) => {
                this.realizeValue(resolve, reject, err, resp);
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
    containsValue(value: V): Promise<Boolean> {
        const self = this;
        const request = this.reqFactory.containsValue(value);
        return new Promise((resolve, reject) => {
            this.client.containsValue(request, (err, resp) => {
                this.realizeValue(resolve, reject, err, resp);
            });
        });
    }


    /**
     * Returns a Set view of the keys contained in this map.
     *
     * @return a set view of the keys contained in this map
     */
    entrySet(): IRemoteSet<NamedCacheEntry<K, V>> {
        return new EntrySet(this);   //TODO return StreamedSet
    }


    /**
     * Returns the value to which this cache maps the specified key.
     *
     * @param key The key whose associated value is to be returned.
     *
     * @return A Promise that will eventually resolve to the value that
     *         is associated with the specified key.
     */
    get(key: K): Promise<V> {
        const self = this;
        return new Promise((resolve, reject) => {
            this.client.get(self.reqFactory.get(key), (err, resp) => {
                this.realizeValue(resolve, reject, err, resp, NamedCacheClient.toValue);
            });
        });
    }

    /**
     * Returns the value to which the specified key is mapped, or
     * the specified defaultValue if this map contains no mapping for the key.
     */
    async getOrDefault(key: K, defaultValue: V): Promise<V> {
        return this.get(key).then(val => {
            return val == null ? defaultValue : val;
        });
    }

    /**
     * Checks if this cache is empty or not.
     *
     * @return A Promise that eventually resolves to true if the cache is empty;
     *         false otherwise.
     */
    isEmpty(): Promise<Boolean> {
        return new Promise((resolve, reject) => {
            const request = new IsEmptyRequest();
            request.setCache(this.cacheName);
            this.client.isEmpty(request, (err, resp) => {
                this.realizeValue(resolve, reject, err, resp);
            });
        });
    }

    /**
     * Returns a Set view of the keys contained in this map.
     *
     * @return a set view of the keys contained in this map
     */
    keySet(): IRemoteSet<K> {
        return new KeySet(this);   //TODO return StreamedSet
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
            this.client.put(self.reqFactory.put(key, value, ttl), (err, resp) => {
                this.realizeValue(resolve, reject, err, resp, NamedCacheClient.toValue);
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
        const request = self.reqFactory.putIfAbsent(key, value, ttl);
        return new Promise((resolve, reject) => {
            this.client.putIfAbsent(request, (err, resp) => {
                this.realizeValue(resolve, reject, err, resp, NamedCacheClient.toValue);
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
        return new Promise((resolve, reject) => {
            this.client.remove(this.reqFactory.remove(key), (err, resp) => {
                this.realizeValue(resolve, reject, err, resp, NamedCacheClient.toValue);
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
        const request = this.reqFactory.removeMapping(key, value);
        return new Promise((resolve, reject) => {
            this.client.removeMapping(request, (err, resp) => {
                this.realizeValue(resolve, reject, err, resp);
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
        const request = this.reqFactory.replace(key, value);
        return new Promise((resolve, reject) => {
            this.client.replace(request, (err, resp) => {
                this.realizeValue(resolve, reject, err, resp, NamedCacheClient.toValue);
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
    replaceMapping(key: K, value: V, newValue: V): Promise<Boolean> {
        const request = this.reqFactory.replaceMapping(key, value, newValue);

        return new Promise((resolve, reject) => {
            this.client.replaceMapping(request, (err, resp) => {
                this.realizeValue(resolve, reject, err, resp);
            });
        });
    }
    /**
     * Returns a Set view of the values contained in this cache.
     *
     * @return a set view of the values contained in this cache
     */
    values(): IRemoteSet<V> {
        return new ValueSet(this);   //TODO return StreamedSet
    }

    nextEntrySetPage(cookie: Uint8Array | string | undefined): grpc.ClientReadableStream<EntryResult> {
        return this.client.nextEntrySetPage(this.reqFactory.pageRequest(cookie));
    }

    nextKeySetPage(cookie: Uint8Array | string | undefined): grpc.ClientReadableStream<BytesValue> {
        return this.client.nextKeySetPage(this.reqFactory.pageRequest(cookie));
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
            this.client.size(request, (err, resp) => {
                if (err || !resp) {
                    reject(err);
                } else {
                    resolve(resp.getValue());
                }
            });
        });
    }


    private realizeValue<T, S>(resolve: (value?: T | S | PromiseLike<T | S>) => void,
        reject: (reason?: any) => void,
        err: grpc.ServiceError | null,
        resp?: { getValue(): T } | undefined,
        fn?: (val: T) => S) {

        if (err) {
            reject(err);
        } else {
            if (resp) {
                if (fn) {
                    resolve(fn(resp.getValue()));
                } else {
                    resolve(resp.getValue());
                }
            } else {
                resolve();
            }
        }
    }

    static toBuffer(obj: any) {
        return Buffer.from(JSON.stringify(obj));
    }

    static toValue(value: Uint8Array | string) {
        return (value && value.length > 0)
            ? JSON.parse(Buffer.from(value).toString())
            : null;
    }

}

/**
 * NamedCacheOptions contains the options that can be specified during
 * NamedCacheClient creation.
 */
export interface NamedCacheOptions {
    /**
     * The channel that must be used. This allows sharing gRPC Channels
     * among multiple NamedCacheClients.
     */
    channel?: grpc.Channel;

}