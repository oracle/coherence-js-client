/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { EventEmitter } from 'events';
import { NamedCacheServiceClient } from "../cache/proto/services_grpc_pb";
import { ClientDuplexStream } from "grpc";
import { MapListenerRequest, MapListenerResponse } from "../cache/proto/messages_pb";

import { RequestFactory } from "../cache/request_factory";
import { MapEventFilter } from "../filter/map_event_filter";
import { MapEvent } from "./map_event";
import { ObservableMap } from "./observable_map";
import { MapListener } from "./map_listener";
import { Filters } from "../filter/filters";
import { Serializer } from "./serializer";
import { NamedCacheClient } from "../cache/named_cache_client";

type SubscriptionCallback = (uid: string, cookie: any, err?: Error | undefined) => void;

/**
 * MapEventsManager handles registration, unregistration of {@link MapListener} and
 * notification of {@link MapEvent}s to {@link MapListener}. Since multiple
 * MapListeners can be registered for a single key / filter, this class
 * relies on another internal class called ListenerGroup which maintains the
 * collection of MapListeners.
 *
 * There are two maps that are maintained:
 *
 * 1. A Map of stringified key => ListenerGroup, which is used to identify the
 * group of MapListeners for a single key. We stringify the key since Javascript
 * is not the same as Java's equals().
 *
 * 2. A Map of filter => ListenerGroup that is used to identify the group of
 * MapListeners for a MapEventFilter.
 *
 * When a filter is subscribed, the server responds with a unique filterID.
 * This filterID is what is specified is a MapEvent. So, this class maintains
 * a third Map of filterID to ListenerGroup for efficiently identifying the
 * ListenerGroup for a filterID.
 *
 * This class also lazily creates the "events" stream (a bidi stream). When
 * the first listener is registered, this class calls the "events()" method
 * on the NamedCacheClient and obtains the duplex stream. Similarly, it
 * closes the stream when the last listener is unregistered.
 *
 * Note:- Javascript Maps use only the object identity to check for equality
 * of keys in a Map.  This is fine for Maps that use primitive and strings
 * as keys. But for complex key objects, this wont work as a deserialized
 * object's identity wont be the same as the original object. So, this
 * class uses a method called stringify(obj) that converts the specified
 * object into a stringified form. Currently, this is implemented by just
 * using JSON,.stringify() method.
 */
export class MapEventsManager<K, V> {

    /**
     * Internal: A singleton for a resolved Promise.
     */
    private static RESOLVED = Promise.resolve();

    /**
     * The cache name for which events are received.
     */
    protected cacheName: string;

    /**
     * The gRPC service client.
     */
    protected client: NamedCacheServiceClient;

    /**
     * The ObservableMap (or the NamedCacheClient) that will used as
     * the 'source' of the events. This is typically a NamedCacheClient.
     */
    protected observableMap: ObservableMap<K, V>;

    /**
     * Internal: Request feactory.
     */
    protected reqFactory: RequestFactory<K, V>;

    /**
     * A Promise for lazily creating the duplex stream. The streamPromise
     * will resolve to a ClientDuplexStream<MapListenerRequest, MapListenerResponse>
     * that will be used by this class to send subscriptions and to receive all eevnts.
     */
    private streamPromise: Promise<ClientDuplexStream<MapListenerRequest, MapListenerResponse>> | null = null;

    /**
     * Used to track if a cancel call was due to this object
     * initiating a channel close.
     */
    private markedForClose = false;

    /**
     * A Map containing the outstanding subscriptions. When the corresponding
     * MapListenerResponse is received (for a SubscriptionRequest) then the
     * registered callback is invoked.
     */
    private pendingSubscriptions = new Map<string, SubscriptionCallback>();

    /**
     * The Map of stringified keys => set of listeners (ListenerGroup).
     */
    private keyMap: Map<string, ListenerGroup<K, V>>;

    /**
     * The Map of stringified filter => set of listeners (ListenerGroup).
     */
    private filterMap: Map<string, ListenerGroup<K, V>>;

    /**
     * A Map of filter ID =>  ListenerGroup.
     */
    private filterId2ListenerGroup: Map<number, ListenerGroup<K, V>>;

    /**
     * Internal: A singleton MapEventFilter for an Always filter.
     */
    private static DEFAULT_FILTER = new MapEventFilter(Filters.always());

    private serializer: Serializer;

    private emitter: EventEmitter;

    constructor(cacheName: string, client: NamedCacheServiceClient, observableMap: ObservableMap<K, V>, serialzer: Serializer, emitter: EventEmitter) {
        this.cacheName = cacheName;
        this.client = client;
        this.observableMap = observableMap;
        this.serializer = serialzer;
        this.emitter = emitter;

        // Initialize internal data structures.
        this.keyMap = new Map();
        this.filterMap = new Map();
        this.filterId2ListenerGroup = new Map();
        this.reqFactory = new RequestFactory(cacheName, serialzer);
        this.streamPromise = this.ensureStream();
    }

    getRequestFactory(): RequestFactory<K, V> {
        return this.reqFactory;
    }

    /**
     * Create a BiDi stream lazily.
     */
    ensureStream(): Promise<ClientDuplexStream<MapListenerRequest, MapListenerResponse>> {
        const self = this;
        if (self.streamPromise == null) {
            const bidiStream = self.client.events();

            bidiStream.on('data', (resp) => self.handleResponse(resp));
            bidiStream.on('end', () => self.onEnd());
            bidiStream.on('error', (err) => self.onError(err));
            bidiStream.on('cancelled', () => self.onCancel());

            // Create a SubscribeRequest (with RequestType.INIT)
            const request = self.reqFactory.mapEventSubscribe();
            const initUid = request.getUid();
            self.streamPromise = new Promise((resolve, reject) => {
                // Setup pending subscriptions map so that when the
                // subscribe response comes back, or an error occurs
                // we can resolve or reject the connection.
                self.pendingSubscriptions.set(initUid, (uid, resp, err) => {
                    self.pendingSubscriptions.delete(uid);
                    if (err) {
                        reject(err);
                    } else {
                        // If we received a successful subscribed response,
                        // the connection is initialized. So resolve it.
                        resolve(bidiStream);
                    }
                });

                // Now that we have set up the pending subscriptions map,
                // write the init request.
                bidiStream.write(request);
            });

        }

        return self.streamPromise;
    }

    private onError(err: Error) {
        if (!this.markedForClose) {
            this.emitter.emit('error', this.cacheName + ": Received onError", err);
        }
    }

    private onEnd() {
        if (!this.markedForClose) {
            this.emitter.emit('error', this.cacheName + ": Received onEnd");
        }
    }

    private onCancel() {
        if (!this.markedForClose) {
            this.emitter.emit('error', "** Received onCancel");
        }
    }

    handleResponse(resp: MapListenerResponse) {
        switch (resp.getResponseTypeCase()) {
            case MapListenerResponse.ResponseTypeCase.SUBSCRIBED:
            case MapListenerResponse.ResponseTypeCase.UNSUBSCRIBED:
                const uid = resp.hasSubscribed()
                    ? resp.getSubscribed()?.getUid()
                    : resp.getUnsubscribed()?.getUid();

                if (uid) {
                    const callback = this.pendingSubscriptions.get(uid);
                    this.pendingSubscriptions.delete(uid);
                    if (callback) {
                        callback(uid, resp);
                    }
                }
                break;

            case MapListenerResponse.ResponseTypeCase.DESTROYED:
                if (resp.hasDestroyed() && resp.getDestroyed()?.getCache() == this.cacheName) {
                    this.emitter.emit('cache_destroyed', this.cacheName);
                }
                break;

            case MapListenerResponse.ResponseTypeCase.TRUNCATED:
                if (resp.hasTruncated() && resp.getTruncated()?.getCache() == this.cacheName) {
                    this.emitter.emit('cache_truncated', this.cacheName);
                }
                break;

            case MapListenerResponse.ResponseTypeCase.EVENT:
                if (resp.hasEvent()) {
                    const event = resp.getEvent();
                    if (event) {
                        const mapEvent = new MapEvent(this.cacheName, this.observableMap, event, this.serializer);
                        // mapEvent.print();

                        for (let id of event.getFilteridsList()) {
                            const group = this.filterId2ListenerGroup.get(id);

                            if (group) {
                                group.notifyListeners(mapEvent);
                            }
                        }

                        const stringifiedKey = MapEventsManager.stringify(mapEvent.getKey());
                        const keyGroup = this.keyMap.get(stringifiedKey);
                        if (keyGroup) {
                            keyGroup.notifyListeners(mapEvent);
                        }
                    }
                }
                break;
        }
    }

    registerKeyListener(listener: MapListener<K, V>, key: K, isLite: boolean = false): Promise<void> {
        const stringifiedKey = MapEventsManager.stringify(key);
        let group = this.keyMap.get(stringifiedKey);
        if (!group) {
            group = new KeyListenerGroup(this, key);
            this.keyMap.set(stringifiedKey, group);
        }

        return group.addListener(listener, isLite);
    }

    removeKeyListener(listener: MapListener<K, V>, key: K): Promise<void> {
        const stringifiedKey = MapEventsManager.stringify(key);
        let group = this.keyMap.get(stringifiedKey);
        if (group) {
            return group.removeListener(listener);
        }

        return MapEventsManager.RESOLVED;
    }

    registerFilterListener(listener: MapListener<K, V>, mapFilter: MapEventFilter | null, isLite: boolean = false): Promise<void> {
        const filter = mapFilter == null ? MapEventsManager.DEFAULT_FILTER : mapFilter;
        const stringifiedFilter = MapEventsManager.stringify(filter);

        let group = this.filterMap.get(stringifiedFilter);
        if (!group) {
            group = new FilterListenerGroup(this, filter);
            this.filterMap.set(stringifiedFilter, group);
        }

        return group.addListener(listener, isLite);
    }

    removeFilterListener(listener: MapListener<K, V>, mapFilter: MapEventFilter | null): Promise<void> {
        const filter = mapFilter == null ? MapEventsManager.DEFAULT_FILTER : mapFilter;
        const stringifiedFilter = MapEventsManager.stringify(filter);

        let group = this.filterMap.get(stringifiedFilter);
        if (!group) {
            return MapEventsManager.RESOLVED;
        }

        return group.removeListener(listener);
    }

    writeRequest(request: MapListenerRequest): Promise<void> {
        const self = this;
        return this.ensureStream()
            .then((stream: ClientDuplexStream<MapListenerRequest, MapListenerResponse>) => {
                return new Promise<void>((resolve, reject) => {
                    self.pendingSubscriptions.set(request.getUid(), (uid, resp, err) => {
                        self.pendingSubscriptions.delete(uid);
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                    stream.write(request);
                });
            });
    }

    static stringify = (obj: any): string => JSON.stringify(obj);

    /**
     * Close this event stream.
     */
    async closeEventStream(): Promise<void> {
        const self = this;
        if (!self.markedForClose && self.streamPromise != null) {
            self.markedForClose = true;
            const bidiStream = await self.streamPromise;
            await new Promise(async (resolve, reject) => {
                // Setup an event handler for 'error' as calling cancel() on
                // the bidi stream will result in a CANCELLED sttaus.
                bidiStream.on('error', (err) => {
                    if (err.toString().indexOf('CANCELLED')) {
                        self.streamPromise = null;
                        resolve();
                    }
                });
                bidiStream.cancel();
            });
        }
        return Promise.resolve();
    }

    keyGroupUnsubscribed(key: string): void {
        this.keyMap.delete(MapEventsManager.stringify(key));
    }

    filterGroupSubscribed(filterId: number, group: ListenerGroup<K, V>): void {
        this.filterId2ListenerGroup.set(filterId, group);
    }

    filterGroupUnsubscribed(filterId: number, filter: MapEventFilter): void {
        this.filterId2ListenerGroup.delete(filterId);
        this.filterMap.delete(MapEventsManager.stringify(filter));
    }

}

/**
 * Manages a collection of MapEventListeners. Handles sending out
 * MapListenerRequest subscriptions / unsubscriptions.  Also, handles
 * notification of all the registered listeners.
 */
abstract class ListenerGroup<K, V> {

    /**
     * Active status will be true if the subscribe request has been sent.
     * It will be false if a unsubscribe request has been sent.
     */
    isActive: boolean = true;   // Initially active.

    /**
     * The key or the filter for which this group of MapListener will
     * receive events.
     */
    keyOrFilter: K | MapEventFilter;

    /**
     * The current value of isLite that is registered with the cache.
     * If a new listener is added to the group that requires isLite == false
     * but if the registeredIsLite is true, then a re-registration occurs.
     *
     * Similarly if a listener is removed whose isLite == false but if all the
     * remaining listeners are interested in only isLite == true, then a
     * re-registration occurs.
     */
    registeredIsLite: boolean = true;

    /**
     * A map of all listeners in this group. Each listener has a isLite
     * flag.
     */
    listeners: Map<MapListener<K, V>, { isLite: boolean }> = new Map();

    /**
     * Number of MapListeners who are registered with isLite == false.
     * If this transitions from zero to non-zero (or vice versa), then
     * a re-registration happens is the current registeredIsLite is true.
     */
    isLiteFalseCount: number = 0;

    helper: MapEventsManager<K, V>;

    /**
     * Internal: A singleton resolved Promise.
     */
    private static RESOLVED = Promise.resolve();

    constructor(helper: MapEventsManager<K, V>, keyOrFilter: K | MapEventFilter) {
        this.helper = helper;
        this.keyOrFilter = keyOrFilter;
    }

    /**
     * Add a MapListener to this group. This causes a subscription message
     * to be sent through the stream if (a) either this is the first
     * listener, or (b) the isLite param is false but all the previous
     * listeners have isLite == true.
     *
     * @param listener The MapListener to add.
     * @param isLite  The isLite flag.
     */
    async addListener(listener: MapListener<K, V>, isLite: boolean): Promise<void> {
        // Check if this Listener is already registered.
        const prevStatus = this.listeners.get(listener);

        if (prevStatus && prevStatus.isLite == isLite) {
            // This listener is registered with the same isLite status.
            // So, nothing to do.
            return ListenerGroup.RESOLVED;
        }

        this.listeners.set(listener, { isLite });
        if (!isLite) {
            this.isLiteFalseCount++;
        }

        // We need registration request only if the current
        // set of listeners are all using isLite == true, but
        // the new listener is requesting isLite = false. So we need to
        // send a new registration request with the new isLite flag.
        let requireRegistrationRequest = this.listeners.size == 1 || this.registeredIsLite == true && isLite == false;
        const self = this;

        if (requireRegistrationRequest) {
            this.registeredIsLite = isLite;
            if (this.listeners.size > 1) {
                // A change in isLite; So need to do re-registration
                await self.doUnsubscribe();
            }
            await self.doSubscribe(isLite);
        }

        return ListenerGroup.RESOLVED;
    }

    /**
     * Remove the specified MapListener from this group.
     *
     * @param listener The MapListener to be removed.
     */
    async removeListener(listener: MapListener<K, V>): Promise<void> {
        const prevStatus = this.listeners.get(listener);
        if (!prevStatus || this.listeners.size == 0) {
            // This listener was never registered.
            return ListenerGroup.RESOLVED;
        }

        this.listeners.delete(listener);

        if (this.listeners.size == 0) {
            // This was the last MapListener.
            return await this.doUnsubscribe();
        }

        if (prevStatus.isLite == false) {
            // We removed a isLite == false MapListner.
            this.isLiteFalseCount--;

            if (this.isLiteFalseCount == 0) {
                await this.doUnsubscribe();
                await this.doSubscribe(true /* isLite is true */);
            }
        }

        return ListenerGroup.RESOLVED;
    }

    async doSubscribe(isLite: boolean): Promise<void> {
        const request = this.helper.getRequestFactory().mapListenerRequest(true, this.keyOrFilter, isLite);
        await this.helper.writeRequest(request);
        this.postSubscribe(request);
    }

    async doUnsubscribe(): Promise<void> {

        const request = this.helper.getRequestFactory().mapListenerRequest(false, this.keyOrFilter);
        await this.helper.writeRequest(request);

        this.postUnsubscribe(request);
    }

    notifyListeners(mapEvent: MapEvent): void {
        for (let listener of this.listeners.keys()) {
            switch (mapEvent.getId()) {
                case MapEvent.ENTRY_DELETED:
                    listener.entryDeleted(mapEvent);
                    break;
                case MapEvent.ENTRY_INSERTED:
                    listener.entryInserted(mapEvent);
                    break;
                case MapEvent.ENTRY_UPDATED:
                    listener.entryUpdated(mapEvent);
                    break;
            }
        }
    }

    abstract postSubscribe(request: MapListenerRequest): void;

    abstract postUnsubscribe(request: MapListenerRequest): void;

}

class KeyListenerGroup<K, V>
    extends ListenerGroup<K, V> {

    constructor(helper: MapEventsManager<K, V>, key: K) {
        super(helper, key);
    }

    postSubscribe(request: MapListenerRequest): void {
    }

    postUnsubscribe(request: MapListenerRequest): void {
        const key = this.helper.getRequestFactory().getSerializer().deserialize(request.getKey());
        this.helper.keyGroupUnsubscribed(key);
    }

}

class FilterListenerGroup<K, V>
    extends ListenerGroup<K, V> {

    constructor(helper: MapEventsManager<K, V>, filter: MapEventFilter) {
        super(helper, filter);
    }

    postSubscribe(request: MapListenerRequest): void {
        this.helper.filterGroupSubscribed(request.getFilterid(), this);
    }

    postUnsubscribe(request: MapListenerRequest): void {
        this.helper.filterGroupUnsubscribed(request.getFilterid(), this.keyOrFilter as MapEventFilter);
    }

}
