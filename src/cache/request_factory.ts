import {
    ClearRequest,
    ContainsKeyRequest,
    ContainsValueRequest,
    ContainsEntryRequest,
    GetRequest,
    PutRequest,
    PutIfAbsentRequest,
    PageRequest,
    RemoveRequest,
    RemoveMappingRequest,
    ReplaceRequest,
    ReplaceMappingRequest
} from "./proto/messages_pb";
import { BytesValue } from "google-protobuf/google/protobuf/wrappers_pb";

/**
 * A class to facilitate Request message creation.
 */
export class RequestFactory<K, V> {
    static JSON_FORMAT: string = "json";

    cacheName: string;

    constructor(cacheName: string) {
        this.cacheName = cacheName;
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
        request.setKey(RequestFactory.toBuffer(key));
        if (value) {
            request.setValue(RequestFactory.toBuffer(value));
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
        request.setKey(RequestFactory.toBuffer(key));

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
            request.setValue(RequestFactory.toBuffer(value));
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
        request.setKey(RequestFactory.toBuffer(key));

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
        request.setKey(RequestFactory.toBuffer(key));
        if (value) {
            request.setValue(RequestFactory.toBuffer(value));
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
        request.setKey(RequestFactory.toBuffer(key));
        if (value) {
            request.setValue(RequestFactory.toBuffer(value));
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
        request.setKey(RequestFactory.toBuffer(key));

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
        request.setKey(RequestFactory.toBuffer(key));
        if (value) {
            request.setValue(RequestFactory.toBuffer(value));
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
        request.setKey(RequestFactory.toBuffer(key)); if (value) {
            request.setValue(RequestFactory.toBuffer(value));
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
        request.setKey(RequestFactory.toBuffer(key));
        if (value) {
            request.setPreviousvalue(RequestFactory.toBuffer(value));
        }
        if (value) {
            request.setNewvalue(RequestFactory.toBuffer(newValue));
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

    static toBuffer(obj: any) {
        return Buffer.from(JSON.stringify(obj));
    }

    static toValue(value: Uint8Array | string) {
        return (value && value.length > 0)
            ? JSON.parse(Buffer.from(value).toString())
            : null;
    }
}