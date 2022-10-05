/*
 * Copyright (c) 2020, 2022 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * https://oss.oracle.com/licenses/upl.
 */

import {ClientDuplexStream} from '@grpc/grpc-js'
import {EventEmitter} from 'events'
import {filter} from './filters'
import {MapEventResponse, MapListenerRequest, MapListenerResponse} from './grpc/messages_pb'
import {NamedCacheServiceClient} from './grpc/services_grpc_pb'
import {NamedCache, NamedMap} from './named-cache-client'
import {util} from './util'
import {ConnectivityState} from "@grpc/grpc-js/build/src/connectivity-state";
import {Session} from "./session";

export namespace event {

  import Filter = filter.Filter

  /**
   * EventEmitter implementation to receive {@link MapEvent}s.
   */
  export class MapListener<K, V> extends EventEmitter {
  }

  export class MapEvent<K = any, V = any> {
    /**
     * This event indicates that an entry has been added to the map.
     */
    static readonly ENTRY_INSERTED = 1

    /**
     * This event indicates that an entry has been updated in the map.
     */
    static readonly ENTRY_UPDATED = 2

    /**
     * This event indicates that an entry has been removed from the map.
     */
    static readonly ENTRY_DELETED = 3

    /**
     * Serialized representation of the cache key associated with this event.
     */
    protected keyBytes: Uint8Array
    /**
     * Serialized representation of the new cache value associated with this event.
     */
    protected newValueBytes?: Uint8Array
    /**
     * Serialized representation of the old cache value associated with this event.
     */
    protected oldValueBytes?: Uint8Array

    /**
     * The {@link Serializer} to use to deserialize in-bound `MapEvents`.
     */
    protected serializer: util.Serializer

    /**
     * Constructs a new `MapEvent`
     *
     * @param source             the event source
     * @param mapEventResponse   the {@link MapEventResponse} from the server
     * @param serializer
     */
    constructor (source: NamedCache<K, V>, mapEventResponse: MapEventResponse, serializer: util.Serializer) {
      this._name = source.name
      this._source = () => source
      this.serializer = serializer
      this._id = mapEventResponse.getId()
      this.keyBytes = mapEventResponse.getKey_asU8()
      this.newValueBytes = mapEventResponse.getNewvalue_asU8()
      this.oldValueBytes = mapEventResponse.getOldvalue_asU8()
    }

    /**
     * The name of cache from which the event originated.
     */
    protected _name: string

    /**
     * Return the cache name from which the event originated.
     *
     * @return the cache name from which the event originated
     */
    get name (): string {
      return this._name
    }

    /**
     * The event source.
     */
    protected _source: () => NamedCache<K, V> // this is a function vs a direct reference to avoid circularity errors when converting to JSON

    /**
     * Return the event source.
     *
     * @return the event source
     */
    get source (): NamedCache<K, V> {
      return this._source()
    }

    /**
     * Event id; may be one of {@link ENTRY_INSERTED}, {@link ENTRY_UPDATED}, or {@link ENTRY_DELETED}.
     */
    protected _id: number

    /**
     * Return the event ID.
     * This may be one of:
     * - {@link MapEvent.ENTRY_INSERTED}
     * - {@link MapEvent.ENTRY_UPDATED}
     * - {@link MapEvent.ENTRY_DELETED}
     *
     * @return the event ID
     */
    get id (): number {
      return this._id
    }

    /**
     * Return a `string` description of the event ID.
     *
     * @param eventId  the event ID
     *
     * @return a `string` description of the event ID
     */
    private static getDescription (eventId: number): string {
      switch (eventId) {
        case MapEvent.ENTRY_INSERTED:
          return 'insert'

        case MapEvent.ENTRY_UPDATED:
          return 'update'

        case MapEvent.ENTRY_DELETED:
          return 'delete'

        default:
          return '<unknown: ' + eventId + '>'
      }
    }

    /**
     * The deserialized key.
     */
    protected _key?: K

    /**
     * Return the key for the entry generating the event.
     *
     * @return the key for the entry generating the event
     */
    get key (): K {
      if (!this._key) {
        this._key = this.serializer.deserialize(this.keyBytes)
      }
      if (!this._key) {
        throw new Error('unable to deserialize key using format: ' + this.serializer.format)
      }
      return this._key
    }

    /**
     * The deserialized new value.
     */
    protected _newValue?: V

    /**
     * Return the new value for the entry generating the event.
     *
     * @return the new value, if any, for the entry generating the event
     */
    get newValue (): V | undefined {
      if (!this._newValue && this.newValueBytes) {
        this._newValue = this.serializer.deserialize(this.newValueBytes)
      }
      return this._newValue
    }

    /**
     * The deserialized old value.
     */
    protected _oldValue?: V

    /**
     * Return the old value for the entry generating the event.
     *
     * @return the old value, if any, for the entry generating the event
     */
    get oldValue (): V | undefined {
      if (!this._oldValue && this.oldValueBytes) {
        this._oldValue = this.serializer.deserialize(this.oldValueBytes)
      }
      return this._oldValue
    }

    /**
     * Return a `string` description for the event.
     * This may be one of:
     * - `inserted`
     * - `updated`
     * - `deleted`
     *
     * @return a `string` description for the event
     */
    get description (): string {
      return MapEvent.getDescription(this._id)
    }
  }

  type SubscriptionCallback = (uid: string, cookie: any, err?: Error | undefined) => void;

  /**
   * MapEventsManager handles registration, de-registration of callbacks, and
   * notification of {@link MapEvent}s to callbacks. Since multiple
   * callbacks can be registered for a single key / filter, this class
   * relies on another internal class called ListenerGroup which maintains the
   * collection of callbacks.
   *
   * There are two maps that are maintained:
   *
   * 1. A Map of string keys mapped to a ListenerGroup, which is used to identify the
   * group of callbacks for a single key. We stringify the key since Javascript
   * is not the same as Java's equals().
   *
   * 2. A Map of filter => ListenerGroup that is used to identify the group of
   * callbacks for a MapEventFilter.
   *
   * When a filter is subscribed, the server responds with a unique filterID.
   * This filterID is what is specified is a MapEvent. So, this class maintains
   * a third Map of filterID to ListenerGroup for efficiently identifying the
   * ListenerGroup for a filterID.
   *
   * This class also lazily creates the "events" stream (a bidi stream). When
   * the first callback is registered, this class calls the "events()" method
   * on the NamedCacheClient and obtains the duplex stream. Similarly, it
   * closes the stream when the last callback is unregistered.
   *
   * @internal
   */
  export class MapEventsManager<K, V> {
    /**
     * A singleton for a resolved Promise.
     */
    private static RESOLVED = Promise.resolve()

    /**
     * A singleton MapEventFilter for an Always filter.
     */
    private static DEFAULT_FILTER = new filter.MapEventFilter(filter.MapEventFilter.ALL, filter.AlwaysFilter.INSTANCE)

    /**
     * The map name for which events are received.
     */
    protected mapName: string

    /**
     * The gRPC service client.
     */
    protected client: NamedCacheServiceClient

    /**
     * The `NamedMap` used as the *source* of the events.
     */
    protected namedMap: NamedMap<K, V>

    /**
     * Request factory.
     */
    protected reqFactory: util.RequestFactory<K, V>

    /**
     * A Promise for lazily creating the duplex stream. The streamPromise
     * will resolve to a ClientDuplexStream<MapListenerRequest, MapListenerResponse>
     * that will be used by this class to send subscriptions and to receive all events.
     */
    private streamPromise: Promise<ClientDuplexStream<MapListenerRequest, MapListenerResponse> | null> | null = null

    /**
     * Used to track if a cancel call was due to this object
     * initiating a channel close.
     */
    private markedForClose = false

    /**
     * A Map containing the outstanding subscriptions. When the corresponding
     * MapListenerResponse is received (for a SubscriptionRequest) then the
     * registered callback is invoked.
     */
    private pendingSubscriptions = new Map<string, SubscriptionCallback>()

    /**
     * The Map of keys => set of listeners (ListenerGroup).
     */
    private keyMap: Map<K, ListenerGroup<K, V>>

    /**
     * The Map of MapEventFilter => set of listeners (ListenerGroup).
     */
    private filterMap: Map<filter.Filter, ListenerGroup<K, V>>

    /**
     * A Map of filter ID =>  ListenerGroup.
     */
    private filterId2ListenerGroup: Map<number, ListenerGroup<K, V>>

    /**
     * The serializer to apply when ser/deser map events.
     */
    private readonly serializer: util.Serializer

    /**
     * The {@link EventEmitter}.
     */
    private emitter: EventEmitter

    /**
     * The `Session` associated with this event stream.
     *
     * @private
     */
    private session: Session;

    /**
     * Callback for session reconnect events.
     * @private
     */
    private readonly onReconnect: () => void

    /**
     * Callback for session disconnect events.
     * @private
     */
    private readonly onDisconnect: () => void

    /**
     * Constructs a new `MapEventsManager`
     *
     * @param namedMap    the {@link NamedMap} to manage events for
     * @param session     the associated {@link Session}
     * @param client      the `gRPC` interface for making requests
     * @param serializer  the {@link Serializer} used by this map
     * @param emitter     the {@link EventEmitter} to use
     */
    constructor (namedMap: NamedMap<K, V>, session: Session, client: NamedCacheServiceClient, serializer: util.Serializer, emitter: EventEmitter) {
      this.mapName = namedMap.name
      this.client = client
      this.namedMap = namedMap
      this.serializer = serializer
      this.emitter = emitter
      this.session = session;

      // Initialize internal data structures.
      this.keyMap = new Map()
      this.filterMap = new Map()
      this.filterId2ListenerGroup = new Map()
      this.reqFactory = new util.RequestFactory(this.mapName, session.scope, serializer)
      this.streamPromise = this.ensureStream()

      this.onDisconnect = async () => {
        let st: ClientDuplexStream<MapListenerRequest, MapListenerResponse> | null = null;
        try {
          st = await this.streamPromise
        } catch (err: any) {
          // ignore
        }
        if (st !== null) {
          st.cancel()
        }
        this.streamPromise = null;
      }
      session.on(SessionLifecycleEvent.DISCONNECTED, this.onDisconnect)

      this.onReconnect = () => {
        this.keyMap.forEach(async value =>  {
          await value.doSubscribe(value.registeredIsLite)
        })
        this.filterMap.forEach(async value => {
          await value.doSubscribe(value.registeredIsLite)
        })
      }
      session.on(SessionLifecycleEvent.RECONNECTED, this.onReconnect)
    }

    /**
     * Create a BiDi stream lazily.
     */
    ensureStream (): Promise<ClientDuplexStream<MapListenerRequest, MapListenerResponse> | null> {
      const self = this
      if (self.streamPromise == null) {
        self.streamPromise = new Promise((resolve) => {
          self.client.waitForReady(Date.now() + this.session.options.readyTimeoutInMillis, (err) => {
            if (err) {
              this.streamPromise = this.ensureStream()
              resolve(null)
            }
            const bidiStream = self.client.events()

            bidiStream.on('data', (resp) => self.handleResponse(resp))
            bidiStream.on('error', (err) => self.onError(err))

            // Create a SubscribeRequest (with RequestType.INIT)
            const request = self.reqFactory.mapEventSubscribe()
            const initUid = request.getUid()

            // If we received a successful subscribed response,
            // the connection is initialized. So resolve it.
            resolve(bidiStream)

            // Setup pending subscriptions map so that when the
            // subscribe response comes back, or an error occurs
            // we can resolve or reject the connection.
            self.pendingSubscriptions.set(initUid, (uid, resp, err) => {
              self.pendingSubscriptions.delete(uid)
              if (err) {
                this.streamPromise = this.ensureStream()
                resolve(null)
              } else {
                // If we received a successful subscribed response,
                // the connection is initialized. So resolve it.
                resolve(bidiStream)
              }
            })

            // Now that we have set up the pending subscriptions map,
            // write the init request.
            bidiStream.write(request)
          })
        })
      }

      return self.streamPromise
    }

    /**
     * Process incoming `gRPC` {@link MapListenerResponse}s.
     *
     * @param resp  the {@link MapListenerResponse} to process
     */
    handleResponse (resp: MapListenerResponse) {
      switch (resp.getResponseTypeCase()) {
        case MapListenerResponse.ResponseTypeCase.SUBSCRIBED:
        case MapListenerResponse.ResponseTypeCase.UNSUBSCRIBED:
          const uid = resp.hasSubscribed()
            ? resp.getSubscribed()?.getUid()
            : resp.getUnsubscribed()?.getUid()

          if (uid) {
            const callback = this.pendingSubscriptions.get(uid)
            this.pendingSubscriptions.delete(uid)
            if (callback) {
              callback(uid, resp)
            }
          }
          break

        case MapListenerResponse.ResponseTypeCase.DESTROYED:
          if (resp.hasDestroyed() && resp.getDestroyed()?.getCache() == this.mapName) {
            this.emitter.emit(MapLifecycleEvent.DESTROYED, this.mapName)
          }
          break

        case MapListenerResponse.ResponseTypeCase.TRUNCATED:
          if (resp.hasTruncated() && resp.getTruncated()?.getCache() == this.mapName) {
            this.emitter.emit(MapLifecycleEvent.TRUNCATED, this.mapName)
          }
          break

        case MapListenerResponse.ResponseTypeCase.EVENT:
          if (resp.hasEvent()) {
            const event = resp.getEvent()
            if (event) {
              const mapEvent = new MapEvent(this.namedMap, event, this.serializer)

              for (const id of event.getFilteridsList()) {
                const group = this.filterId2ListenerGroup.get(id)

                if (group) {
                  group.notifyListeners(mapEvent)
                }
              }

              const keyGroup = this.keyMap.get(mapEvent.key)
              if (keyGroup) {
                keyGroup.notifyListeners(mapEvent)
              }
            }
          }
          break
      }
    }

    /**
     * Registers the specified listener to listen for events matching the provided key.
     *
     * @param listener    the {@link MapListener}
     * @param key         the map key to listen to
     * @param isLite      `true` if the event should only include the key, or `false`
     *                    if the event should include old and new values as well as the key
     */
    registerKeyListener (listener: event.MapListener<K, V>, key: K, isLite: boolean = false): Promise<void> {
      let group = this.keyMap.get(key)
      if (!group) {
        group = new KeyListenerGroup(this, key)
        this.keyMap.set(key, group)
      }

      return group.addListener(listener, isLite)
    }

    /**
     * Removes the registration of the listener for the provided key.
     *
     * @param listener    the {@link MapListener}
     * @param key         the key associated with the listener
     */
    removeKeyListener (listener: event.MapListener<K, V>, key: K): Promise<void> {
      const group = this.keyMap.get(key)
      if (group) {
        return group.removeListener(listener)
      }

      return MapEventsManager.RESOLVED
    }

    /**
     * Registers the specified listener to listen for events matching the provided filter.
     *
     * @param listener    the {@link MapListener}
     * @param mapFilter   the {@link filter} associated with the listener
     * @param isLite      `true` if the event should only include the key, or `false`
     *                    if the event should include old and new values as well as the key
     */
    registerFilterListener (listener: event.MapListener<K, V>, mapFilter: Filter | null, isLite: boolean = false): Promise<void> {
      const filter = mapFilter == null ? MapEventsManager.DEFAULT_FILTER : mapFilter

      let group = this.filterMap.get(filter)
      if (!group) {
        group = new FilterListenerGroup<K, V>(this, filter)
        this.filterMap.set(filter, group)
      }

      return group.addListener(listener, isLite)
    }

    /**
     * Removes the registration of the listener for the provided filter.
     *
     * @param listener    the {@link MapListener}
     * @param mapFilter   the {@link MapEventFilter} associated with the listener
     */
    removeFilterListener (listener: event.MapListener<K, V>, mapFilter: filter.MapEventFilter<K, V> | null): Promise<void> {
      const filter = mapFilter == null ? MapEventsManager.DEFAULT_FILTER : mapFilter

      const group = this.filterMap.get(filter)
      if (!group) {
        return MapEventsManager.RESOLVED
      }

      return group.removeListener(listener)
    }

    /**
     * Write the provided `gRPC` {@link MapListenerRequest}.
     *
     * @param request the {@link MapListenerRequest}
     *
     */
    writeRequest (request: MapListenerRequest): Promise<void> {
      const self = this
      return this.ensureStream()
        .then((stream: ClientDuplexStream<MapListenerRequest, MapListenerResponse> | null) => {
          return new Promise<void>((resolve) => {
            if (!stream) {
              resolve()
            } else {
              self.pendingSubscriptions.set(request.getUid(), (uid, resp, err) => {
                self.pendingSubscriptions.delete(uid)
                if (err) {
                  this.streamPromise = this.ensureStream()
                }
                resolve()
              })
              stream.write(request)
            }
          })
        })
    }

    /**
     * Close this event stream.
     */
    async closeEventStream (): Promise<void> {
      const self = this
      if (!self.markedForClose && self.streamPromise != null) {
        self.markedForClose = true
        let bidiStream: ClientDuplexStream<MapListenerRequest, MapListenerResponse> | null = null;
        try {
          bidiStream = await self.streamPromise;
        } catch (err: any) {
        }

        self.session.removeListener(SessionLifecycleEvent.CONNECTED, self.onReconnect)
        self.session.removeListener(SessionLifecycleEvent.RECONNECTED, self.onReconnect)
        self.session.removeListener(SessionLifecycleEvent.DISCONNECTED, self.onDisconnect)

        await new Promise<void>(async (resolve) => {
          // Add an event handler for 'error' as calling cancel() on
          // the bidi stream will result in a CANCELLED status.
          if (bidiStream) {
            bidiStream.on('error', (err) => {
              if (err.toString().indexOf('CANCELLED')) {
                self.streamPromise = null
                resolve()
              }
            })
            bidiStream.end()
          }
          resolve()
        })
      }
      return Promise.resolve()
    }

    /**
     * Remove key from key group.
     *
     * @param key the key to remove
     */
    keyGroupUnsubscribed (key: K): void {
      this.keyMap.delete(key)
    }

    /**
     * Add the filter ID and the group to the ID -> group mapping.
     *
     * @param filterId  the filter ID
     * @param group     the listener group
     */
    filterGroupSubscribed (filterId: number, group: ListenerGroup<K, V>): void {
      this.filterId2ListenerGroup.set(filterId, group)
    }

    /**
     * Unsubscribe the filter ID and filter from their associated maps.
     *
     * @param filterId  the filter ID
     * @param filter    the filter
     */
    filterGroupUnsubscribed (filterId: number, filter: filter.MapEventFilter<K, V>): void {
      this.filterId2ListenerGroup.delete(filterId)
      this.filterMap.delete(filter)
    }

    /**
     * Handles stream errors.
     *
     * @param err  the stream error
     */
    private onError(err: Error) {
      if (!this.markedForClose) {
        if (this.client.getChannel().getConnectivityState(false) == ConnectivityState.READY) {
          // stream cancellation, but channel still okay
          this.streamPromise = null;
          this.keyMap.forEach(async value => {
            await value.doSubscribe(value.registeredIsLite)
          })
          this.filterMap.forEach(async value => {
            await value.doSubscribe(value.registeredIsLite)
          })
        }
      }
    }
  }

  /**
   * Manages a collection of MapEventListeners. Handles sending out
   * MapListenerRequest subscriptions / un-subscriptions.  Also, handles
   * notification of all the registered listeners.
   */
  abstract class ListenerGroup<K, V> {
    /**
     * Internal: A singleton resolved Promise.
     */
    private static RESOLVED = Promise.resolve()

    /**
     * The key or the filter for which this group of callbacks will
     * receive events.
     */
    keyOrFilter: K | filter.Filter

    /**
     * The current value of isLite that is registered with the cache.
     * If a new listener is added to the group that requires isLite == false
     * but if the registeredIsLite is true, then a re-registration occurs.
     *
     * Similarly, if a listener is removed whose isLite == false but if all the
     * remaining listeners are interested in only isLite == true, then a
     * re-registration occurs.
     */
    registeredIsLite: boolean = true

    /**
     * A map of all callbacks in this group. Each callback has a isLite
     * flag.
     */
    listeners: Map<event.MapListener<K, V>, { isLite: boolean }> = new Map()

    /**
     * Number of callbacks who are registered with isLite == false.
     * If this transitions from zero to non-zero (or vice versa), then
     * a re-registration happens is the current registeredIsLite is true.
     */
    isLiteFalseCount: number = 0

    /**
     * Reference to MapEventsManager.
     */
    helper: MapEventsManager<K, V>

    /**
     * Constructs a new `ListenerGroup`.
     *
     * @param helper       the {@link MapEventsManager}
     * @param keyOrFilter  the key or filter for this group of listeners
     */
    protected constructor (helper: MapEventsManager<K, V>, keyOrFilter: K | filter.Filter) {
      this.helper = helper
      this.keyOrFilter = keyOrFilter
    }

    /**
     * Add a callback to this group. This causes a subscription message
     * to be sent through the stream if (a) either this is the first
     * callback, or (b) the isLite param is false but all the previous
     * callback have isLite == true.
     *
     * @param listener    the {@link MapListener}
     * @param isLite      `true` if the event should only include the key, or `false`
     *                    if the event should include old and new values as well as the key
     */
    async addListener (listener: event.MapListener<K, V>, isLite: boolean): Promise<void> {
      // Check if this callback is already registered.
      const prevStatus = this.listeners.get(listener)

      if (prevStatus?.isLite === isLite) {
        // This listener is registered with the same isLite status.
        // So, nothing to do.
        return ListenerGroup.RESOLVED
      }

      this.listeners.set(listener, { isLite })
      if (!isLite) {
        this.isLiteFalseCount++
      }

      const size = this.listeners.size

      // We need registration request only if the current
      // set of listeners are all using isLite == true, but
      // the new listener is requesting isLite = false. So we need to
      // send a new registration request with the new isLite flag.
      const requireRegistrationRequest = size === 1 || this.registeredIsLite && !isLite
      const self = this

      if (requireRegistrationRequest) {
        this.registeredIsLite = isLite
        if (size && size > 1) {
          // A change in isLite; So need to do re-registration
          await self.doUnsubscribe()
        }
        await self.doSubscribe(isLite)
      }

      return ListenerGroup.RESOLVED
    }

    /**
     * Remove the specified callback from this group.
     *
     @param listener  the {@link MapListener}
     */
    async removeListener (listener: event.MapListener<K, V>): Promise<void> {
      // note: handlers should never be undefined, but the compiler forces optional chaining
      const prevStatus = this.listeners.get(listener)

      if (!prevStatus || this.listeners.size === 0) {
        // This listener was never registered.
        return ListenerGroup.RESOLVED
      }

      this.listeners.delete(listener)

      if (this.listeners.size == 0) {
        // This was the last callback.
        return await this.doUnsubscribe()
      }

      if (!prevStatus.isLite) {
        // We removed a isLite == false callback.
        this.isLiteFalseCount--

        if (this.isLiteFalseCount == 0) {
          await this.doUnsubscribe()
          await this.doSubscribe(true /* isLite is true */)
        }
      }

      return ListenerGroup.RESOLVED
    }

    /**
     * Send a `gRPC` {@link MapListenerRequest} to subscribe the key or filter.
     *
     * @param isLite `true` if the event should only include the key, or `false`
     *               if the event should include old and new values as well as the key
     */
    async doSubscribe (isLite: boolean): Promise<void> {
      // @ts-ignore
      const request = this.helper.reqFactory.mapListenerRequest(true, this.keyOrFilter, isLite)
      await this.helper.writeRequest(request)
      this.postSubscribe(request)
    }

    /**
     * Send a `gRPC` {@link MapListenerRequest} to unsubscribe the key or filter.
     */
    async doUnsubscribe (): Promise<void> {
      // @ts-ignore
      const request = this.helper.reqFactory.mapListenerRequest(false, this.keyOrFilter)
      await this.helper.writeRequest(request)

      this.postUnsubscribe(request)
    }

    /**
     * Notify all relevant listeners with the provided event.
     *
     * @param mapEvent the {@link MapEvent}
     */
    notifyListeners (mapEvent: MapEvent): void {
      for (const listener of this.listeners.keys()) {
        switch (mapEvent.id) {
          case MapEvent.ENTRY_DELETED:
            listener.emit(MapEventType.DELETE, mapEvent)
            break
          case MapEvent.ENTRY_INSERTED:
            listener.emit(MapEventType.INSERT, mapEvent)
            break
          case MapEvent.ENTRY_UPDATED:
            listener.emit(MapEventType.UPDATE, mapEvent)
            break
        }
      }
    }

    /**
     * Custom actions that implementations may need to make after a subscription has been completed.
     *
     * @param request the {@link MapListenerRequest} that was used to subscribe
     */
    abstract postSubscribe (request: MapListenerRequest): void;

    /**
     * Custom actions that implementations may need to make after an unsubscription has been completed.
     *
     * @param request the {@link MapListenerRequest} that was used to unsubscribe
     */
    abstract postUnsubscribe (request: MapListenerRequest): void;
  }

  /**
   * A {@link ListenerGroup} for key-based listeners.
   * @internal
   */
  class KeyListenerGroup<K, V>
    extends ListenerGroup<K, V> {

    /**
     * Constructs a new `KeyListenerGroup`.
     *
     * @param helper  the {@link MapEventsManager}
     * @param key     they group key
     */
    constructor (helper: MapEventsManager<K, V>, key: K) {
      super(helper, key)
    }

    /**
     * @inheritDoc
     */
    postSubscribe (request: MapListenerRequest): void {
    }

    /**
     * @inheritDoc
     */
    postUnsubscribe (request: MapListenerRequest): void {
      // @ts-ignore
      const key = this.helper.serializer.deserialize(request.getKey())
      this.helper.keyGroupUnsubscribed(key)
    }
  }

  /**
   * A {@link ListenerGroup} for filter-based listeners.
   * @internal
   */
  class FilterListenerGroup<K, V>
    extends ListenerGroup<K, V> {
    /**
     * Constructs a new `KeyListenerGroup`.
     *
     * @param helper  the {@link MapEventsManager}
     * @param filter  the group filter
     */
    constructor (helper: MapEventsManager<K, V>, filter: Filter) {
      super(helper, filter)
    }

    /**
     * @inheritDoc
     */
    postSubscribe (request: MapListenerRequest): void {
      this.helper.filterGroupSubscribed(request.getFilterid(), this)
    }

    /**
     * @inheritDoc
     */
    postUnsubscribe (request: MapListenerRequest): void {
      this.helper.filterGroupUnsubscribed(request.getFilterid(), this.keyOrFilter as filter.MapEventFilter<K, V>)
    }
  }

  /**
   * Cache lifecycle events.
   */
  export enum MapLifecycleEvent {
    /**
     * Raised when a cache is destroyed.
     */
    DESTROYED = 'map_destroyed',

    /**
     * Raised when a cache is truncated.
     */
    TRUNCATED = 'map_truncated',

    /**
     * Raised when a cache is released.
     */
    RELEASED = 'map_released'
  }

  export enum MapEventType {
    INSERT = 'insert',
    UPDATE = 'update',
    DELETE = 'delete'
  }

  /**
   * Internal events for tracing request state.
   * @internal
   */
  export enum RequestStateEvent {
    /**
     * Raised when data is received from `gRPC`.
     */
    DATA = 'data',

    /**
     * Raised when the `gRPC` request has completed.
     */
    COMPLETE = 'end',

    /**
     * Raised if an error occurs at the `gRPC` layer.
     */
    ERROR = 'error'
  }

  /**
   * Internal Session lifecycle events
   * @internal
   */
  export enum SessionLifecycleEvent {
    CLOSED = 'session_closed',
    DISCONNECTED = 'session_disconnected',
    RECONNECTED = 'session_reconnected',
    CONNECTED = 'session_connected'
  }
}