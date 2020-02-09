import {
    ClearRequest,
    ContainsKeyRequest,
    ContainsValueRequest,
    ContainsEntryRequest,
    GetRequest,
    PutRequest,
    PutIfAbsentRequest,
    PageRequest,
    RemoveIndexRequest,
    RemoveRequest,
    RemoveMappingRequest,
    ReplaceRequest,
    ReplaceMappingRequest,
    KeySetRequest,
    AddIndexRequest,
    EntrySetRequest,
    ValuesRequest,
    InvokeRequest,
    InvokeAllRequest,
    GetAllRequest,
    MapListenerRequest,
    DestroyRequest
} from "./proto/messages_pb";

import { Serializer } from "../util/serializer";
import { Filter } from "../filter/filter";
import { ValueExtractor } from "../extractor/value_extractor";
import { EntrySet } from "./streamed_collection";
import { EntryProcessor } from "../processor/entry_processor";
import { Filters } from "../filter/filters";
import { Util } from "../util/util";
import { BytesValue } from "google-protobuf/google/protobuf/wrappers_pb";
import { MapEventFilter } from "../filter/map_event_filter";

export interface Comparator {
    '@class': string;
}

/**
 * A class to facilitate Request objects creation.
 *
 */
export class RequestFactory<K, V> {
    static JSON_FORMAT: string = "json";

    cacheName: string;

    // Used for unique uid generation for MapListener subscriptions.
    private uidPrefix: string;

    // The next requestID to be used for subscribe requests.
    private nextRequestId: number = 0;

    // Thje next filterID to be used for filter subscriptions.
    private nextFilterId: number = 0;

    constructor(cacheName: string) {
        if (!cacheName) {
            throw new Error('cache name cannot be null or undefined');
        }
        this.cacheName = cacheName;
        this.uidPrefix = '-' + cacheName + '-' + Date.now() + '-';
    }

    addIndex(extractor: ValueExtractor<any, any>, sorted?: boolean, comparator?: Comparator): AddIndexRequest {
        const request = new AddIndexRequest();

        request.setCache(this.cacheName);
        request.setFormat(RequestFactory.JSON_FORMAT);
        request.setExtractor(Serializer.serialize(extractor));
        if (sorted) {
            request.setSorted(sorted);
        }
        if (comparator) {
            request.setComparator(Serializer.serialize(comparator));
        }

        return request;
    }

    removeIndex(extractor: ValueExtractor<any, any>): RemoveIndexRequest {
        const request = new RemoveIndexRequest();

        request.setCache(this.cacheName);
        request.setFormat(RequestFactory.JSON_FORMAT);
        request.setExtractor(Serializer.serialize(extractor));

        return request;
    }

    /**
     * Create a ClearRequest instance.
     * 
     * @returns A ClearRequest instance.
     */
    clear(): ClearRequest {
        const request = new ClearRequest();
        request.setCache(this.cacheName);

        return request;
    }

    /**
     * Create a ContainsEntryRequest instance.
     * 
     * @param key The key for the request.
     * 
     * @return A ContainsKey instance.
     */
    containsEntry(key: K, value: V): ContainsEntryRequest {
        const request = new ContainsEntryRequest();
        request.setCache(this.cacheName);
        request.setFormat(RequestFactory.JSON_FORMAT);
        request.setKey(Serializer.serialize(key));
        if (value) {
            request.setValue(Serializer.serialize(value));
        }

        return request;
    }

    /**
     * Create a ContainsKeyRequest instance.
     * 
     * @param key The key for the request.
     * 
     * @return A ContainsKey instance.
     */
    containsKey(key: K): ContainsKeyRequest {
        const request = new ContainsKeyRequest();
        request.setFormat(RequestFactory.JSON_FORMAT);
        request.setCache(this.cacheName);
        request.setKey(Serializer.serialize(key));

        return request;
    }

    /**
     * Create a ContainsValueRequest instance.
     * 
     * @param value The value for the request.
     * 
     * @return A ContainsValueRequest instance.
     */
    containsValue(value: V): ContainsValueRequest {
        const request = new ContainsValueRequest();
        request.setFormat(RequestFactory.JSON_FORMAT);
        request.setCache(this.cacheName);
        if (value) {
            request.setValue(Serializer.serialize(value));
        }

        return request;
    }

    /**
     * Create a GetRequest instance.
     * 
     * @param key The key for the request.
     * 
     * @return A GetRequest instance.
     */
    get(key: K): GetRequest {
        const request = new GetRequest();
        request.setFormat(RequestFactory.JSON_FORMAT);
        request.setCache(this.cacheName);
        request.setKey(Serializer.serialize(key));

        return request;
    }

    getAll(keys: Iterable<K>): GetAllRequest {
        const request = new GetAllRequest();
        request.setFormat(RequestFactory.JSON_FORMAT);
        request.setCache(this.cacheName);
        for (let key of keys) {
           request.addKey(Serializer.serialize(key));
        }

        return request;
    }

    entrySet(filter?: Filter<any>, comparator?: any): EntrySetRequest {
        const request = new EntrySetRequest();
        request.setFormat(RequestFactory.JSON_FORMAT);
        request.setCache(this.cacheName);
        if (filter) {
            request.setFilter(Serializer.serialize(filter));
        }
        if (comparator) {
            request.setComparator(Serializer.serialize(comparator));
        }

        return request;
    }

    invoke<R>(key: K, processor: EntryProcessor<K, V, R>): InvokeRequest {
        const request = new InvokeRequest();
        request.setFormat(RequestFactory.JSON_FORMAT);
        request.setCache(this.cacheName);
        request.setKey(Serializer.serialize(key));
        request.setProcessor(Serializer.serialize(processor));

        return request;
    }

    invokeAll<R>(keysOrFilter: Iterable<K> | Filter<V>, processor?: EntryProcessor<K, V, R>): InvokeAllRequest {
        const request = new InvokeAllRequest();
        request.setFormat(RequestFactory.JSON_FORMAT);
        request.setCache(this.cacheName);
        if (Util.isIterableType(keysOrFilter)) {
            for (let key of keysOrFilter) {
                request.addKeys(Serializer.serialize(key))
            }
        } else {
            request.setFilter(Serializer.serialize(keysOrFilter));
        }
        request.setProcessor(Serializer.serialize(processor));
        return request;
    }

    keySet<T>(filter?: Filter<T>): KeySetRequest {
        const request = new KeySetRequest();
        request.setFormat(RequestFactory.JSON_FORMAT);
        request.setCache(this.cacheName);
        if (filter) {
            request.setFilter(Serializer.serialize(filter));
        }
        return request;
    }

    /**
     * Create a PutRequest instance.
     * 
     * @param key The key for the request.
     * @param value The value for the request.
     * 
     * @return A PutRequest instance.
     */
    put(key: K, value: V, ttl?: number): PutRequest {
        const request = new PutRequest();
        request.setFormat(RequestFactory.JSON_FORMAT);
        request.setCache(this.cacheName);
        request.setKey(Serializer.serialize(key));
        if (value) {
            request.setValue(Serializer.serialize(value));
        }
        if (ttl) {
            request.setTtl(ttl);
        }

        return request;
    }

    page(cookie: Uint8Array | string): PageRequest {
        const request = new PageRequest();
        request.setFormat(RequestFactory.JSON_FORMAT);
        request.setCache(this.cacheName);
        request.setCookie(cookie);

        return request;
    }

    /**
     * Create a PutIfAbsentRequest instance.
     * 
     * @param key The key for the request.
     * @param value The value for the request.
     * @param ttl The time to live for the mapping.
     * 
     * @return A PutRPutIfAbsentRequestequest instance.
     */
    putIfAbsent(key: K, value: V, ttl?: number): PutIfAbsentRequest {
        const request = new PutIfAbsentRequest();
        request.setFormat(RequestFactory.JSON_FORMAT);
        request.setCache(this.cacheName);
        request.setKey(Serializer.serialize(key));
        if (value) {
            request.setValue(Serializer.serialize(value));
        }
        if (ttl) {
            request.setTtl(ttl);
        }

        return request;
    }

    /**
     * Create a RemoveRequest instance.
     * 
     * @param key The key for the request.
     * 
     * @return A RemoveRequest instance.
     */
    remove(key: K): RemoveRequest {
        const request = new RemoveRequest();
        request.setFormat(RequestFactory.JSON_FORMAT);
        request.setCache(this.cacheName);
        request.setKey(Serializer.serialize(key));

        return request;
    }

    /**
     * Create a RemoveMappingRequest instance.
     * 
     * @param key The key for the request.
     * @param value The value for the request.
     * 
     * @return A RemoveMappingRequest instance.
     */
    removeMapping(key: K, value: V): RemoveMappingRequest {
        const request = new RemoveMappingRequest();
        request.setFormat(RequestFactory.JSON_FORMAT);
        request.setCache(this.cacheName);
        request.setKey(Serializer.serialize(key));
        if (value) {
            request.setValue(Serializer.serialize(value));
        }

        return request;
    }

    /**
     * Create a ReplaceRequest instance.
     * 
     * @param key The key for the request.
     * 
     * @return A ReplaceRequest instance.
     */
    replace(key: K, value: V): ReplaceRequest {
        const request = new ReplaceRequest();
        request.setFormat(RequestFactory.JSON_FORMAT);
        request.setCache(this.cacheName);
        request.setKey(Serializer.serialize(key)); if (value) {
            request.setValue(Serializer.serialize(value));
        }

        return request;
    }

    /**
     * Create a ReplaceMappingRequest instance.
     * 
     * @param key The key for the request.
     * @param value The value for the request.
     * @param newValue The new value for the request.
     * 
     * @return A RemoveMappingRequest instance.
     */
    replaceMapping(key: K, value: V, newValue: V): ReplaceMappingRequest {
        const request = new ReplaceMappingRequest();
        request.setFormat(RequestFactory.JSON_FORMAT);
        request.setCache(this.cacheName);
        request.setKey(Serializer.serialize(key));
        if (value) {
            request.setPreviousvalue(Serializer.serialize(value));
        }
        if (value) {
            request.setNewvalue(Serializer.serialize(newValue));
        }

        return request;
    }

    pageRequest(cookie: Uint8Array | string | undefined): PageRequest {
        const request = new PageRequest();
        request.setCache(this.cacheName);
        request.setFormat(RequestFactory.JSON_FORMAT);
        if (cookie) {
            request.setCookie(cookie);
        }

        return request;
    }

    mapListenerRequest(isSubscribe: boolean, keyOrFilter: MapEventFilter | K | null, isLite?: boolean): MapListenerRequest {
        const request = new MapListenerRequest();
        const filterType = keyOrFilter instanceof MapEventFilter;

        request.setUid(this.generateNextRequestId(filterType ? 'filter' : 'key'));
        request.setCache(this.cacheName);
        request.setSubscribe(isSubscribe);
        request.setFormat(Util.JSON_FORMAT);
        if (isLite) {
            request.setLite(isLite);
        }
        request.setPriming(false);
        if (filterType) {
            request.setType(MapListenerRequest.RequestType.FILTER);
            request.setFilterid(++this.nextFilterId);
            request.setFilter(Serializer.serialize(keyOrFilter));
        } else {
            request.setType(MapListenerRequest.RequestType.KEY);
            request.setKey(Serializer.serialize(keyOrFilter));
        }
        request.setTrigger(new Uint8Array());

        return request;
    }

    mapEventSubscribe(): MapListenerRequest {
        const request = new MapListenerRequest();
        request.setCache(this.cacheName);
        request.setUid(this.generateNextRequestId('init'));
        request.setSubscribe(true);
        request.setType(MapListenerRequest.RequestType.INIT);

        return request;
    }

    destroy(): DestroyRequest {
        const request = new DestroyRequest();
        request.setCache(this.cacheName);

        return request;
    }

    private generateNextRequestId(prefix: string): string {
        return prefix + this.uidPrefix + (++this.nextRequestId);
    }

    values(filter?: Filter<any>, comparator?: any): ValuesRequest {
        const request = new ValuesRequest();
        request.setFormat(RequestFactory.JSON_FORMAT);
        request.setCache(this.cacheName);
        if (filter) {
            request.setFilter(Serializer.serialize(filter));
        }
        if (comparator) {
            request.setComparator(Serializer.serialize(comparator));
        }

        return request;
    }

}
