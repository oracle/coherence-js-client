/*
 * Copyright (c) 2020, 2022 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * https://oss.oracle.com/licenses/upl.
 */

import {CallOptions, Channel, ChannelCredentials, credentials} from '@grpc/grpc-js'
import {EventEmitter} from 'events'
import {PathLike, readFileSync} from 'fs'
import {event} from './events'

import {NamedCache, NamedCacheClient, NamedMap} from './named-cache-client'
import {util} from './util'
import {ConnectivityState} from "@grpc/grpc-js/build/src/connectivity-state";

/**
 * Supported {@link Session} options.
 */
export class Options {
  /**
   * Regular expression for basic validation of IPv4 address.
   */
  private static readonly ADDRESS_REGEXP = RegExp('\\S+:\\d{1,5}$')

  /**
   * Address of the target Coherence cluster.  If not explicitly set, this defaults to {@link Session.DEFAULT_ADDRESS}.
   */
  private _address: string

  /**
   * The scope name used to link this `Session` with to the corresponding
   * `ConfigurableCacheFactory` on the server.
   *
   * @private
   */
  private _scope: string

  /**
   * Defines the request timeout, in `milliseconds`, that will be applied to each remote call.
   *
   * If not explicitly set, this defaults to `60000`.
   */
  private _requestTimeoutInMillis: number

  /**
   * Defines the timeout, in `milliseconds`, that will be applied when waiting for
   * the `gRPC` stream to become ready.
   *
   * If not explicitly set, this defaults to `60000`.
   */
  private _readyTimeoutInMillis: number

  /**
   * The serialization format.  Currently, this is always `json`.
   */
  private readonly _format: string

  /**
   * The `gRPC` `ChannelOptions`.
   *
   * @see https://github.com/grpc/grpc-node/tree/master/packages/grpc-js
   */
  private _channelOptions: { [key: string]: any }

  /**
   * A function taking no arguments returning a gRPC CallOptions instance.
   * If not explicitly configured, then the call options will simply define
   * the request timeout.  If the developer explicitly sets this, they are responsible
   * for configuring the timeout (i.e., the call options deadline)
   */
  private _callOptions: () => CallOptions

  /**
   * Flag indicating mutations are no longer allowed.
   */
  private locked: boolean = false;

  /**
   * Optional TLS configuration.
   */
  private _tls: TlsOptions

  /**
   * Return the IPv4 host address and port in the format of `[host]:[port]`.
   *
   * @return the IPv4 host address and port in the format of `[host]:[port]`
   */
  get address (): string {
    return this._address
  }

  /**
   * Set the IPv4 host address and port in the format of `[host]:[port]`
   *
   * @param address  the IPv4 host address and port in the format of `[host]:[port]`
   */
  set address (address: string) {
    if (this.locked) {
      return;
    }
    // ensure address is sane
    if (!Options.ADDRESS_REGEXP.test(address)) {
      throw new Error('Expected address format is \'<hostname>:<port>\'.  Configured: ' + address)
    }

    this._address = address
  }

  /**
   * Returns the request timeout in `milliseconds`.
   *
   * @return the request timeout in `milliseconds`
   */
  get requestTimeoutInMillis (): number {
    return this._requestTimeoutInMillis
  }

  /**
   * Set the request timeout in `milliseconds`.  If the timeout value is zero or less, then no timeout will be applied.
   *
   * @param timeout the request timeout in `milliseconds`
   */
  set requestTimeoutInMillis (timeout: number) {
    if (this.locked) {
      return;
    }
    if (timeout <= 0) {
      timeout = Number.POSITIVE_INFINITY
    }
    this._requestTimeoutInMillis = timeout
  }

  /**
   * Returns the ready timeout in `milliseconds`.
   *
   * @return the ready timeout in `milliseconds`
   */
  get readyTimeoutInMillis(): number {
    return this._readyTimeoutInMillis;
  }

  /**
   * Set the ready timeout in `milliseconds`.  If the timeout value is zero or less, then no timeout will be applied.
   *
   * @param timeout the request timeout in `milliseconds`
   */
  set readyTimeoutInMillis(timeout: number) {
    if (this.locked) {
      return;
    }
    if (timeout <= 0) {
      timeout = Number.POSITIVE_INFINITY
    }
    this._readyTimeoutInMillis = timeout;
  }

  /**
   * Return the scope name used to link this `Session` with to the corresponding
   * `ConfigurableCacheFactory` on the server.
   *
   * @return the scope name used to link this `Session` with to the corresponding
   *         `ConfigurableCacheFactory` on the server
   */
  get scope (): string {
    return this._scope
  }

  /**
   * Set the scope name used to link this `Session` with to the corresponding
   * `ConfigurableCacheFactory` on the server.
   *
   * @return the scope name used to link this `Session` with to the corresponding
   *         `ConfigurableCacheFactory` on the server
   */
  set scope (value: string) {
    this._scope = value
  }

  /**
   * Return the `gRPC` `ChannelOptions`.
   */
  get channelOptions(): { [p: string]: any } {
    return this._channelOptions;
  }

  /**
   * Set the `gRPC` `ChannelOptions`.
   *
   * @param value the `gRPC` `ChannelOptions`
   *
   * @see https://github.com/grpc/grpc-node/tree/master/packages/grpc-js
   */
  set channelOptions(value: { [p: string]: any }) {
    if (this.locked) {
      return;
    }
    this._channelOptions = value;
  }

  /**
   * The serialization format used by this session.  This library currently supports JSON serialization only, thus
   * this always returns 'json'.
   *
   * @return 'json'
   */
  get format (): string {
    return this._format
  }

  /**
   * Set the format.  This is a no-op
   *
   * @param format  the serialization format
   */
  set format(format: string) {
    // no-op
  }

  /**
   * Returns the TLS-specific configuration options.
   *
   * @return the TLS-specific configuration options
   */
  get tls (): TlsOptions {
    return this._tls
  }

  /**
   * Set the TLS-specific configuration options.
   *
   * @param tls the TLS-specific configuration options
   */
  set tls (tls: TlsOptions) {
    this._tls = tls
  }

  /**
   * Sets the gRPC CallOptions that will be applied to each request made using this session.
   *
   * @param callOptions the gRPC CallOptions that will be applied to each request made using this session
   */
  set callOptions (callOptions: () => CallOptions) {
    if (this.locked) {
      return;
    }
    this._callOptions = callOptions
  }

  /**
   * Returns a function that will return the gRPC CallOptions that will be applied to each request made using this session.
   *
   * @return a function that will return the gRPC CallOptions that will be applied to each request made using this session
   */
  get callOptions (): () => CallOptions {
    return this._callOptions
  }

  /**
   * Once called, no further mutations can be made.
   * @hidden
   */
  lock(): void {
    this.locked = true;
    this.tls.lock()
  }

  /**
   * Construct a new {@link Options}.
   */
  constructor () {
    this._address = process.env.grpc_proxy_address || Session.DEFAULT_ADDRESS
    this._requestTimeoutInMillis = Session.DEFAULT_REQUEST_TIMEOUT
    this._readyTimeoutInMillis = Session.DEFAULT_READY_TIMEOUT
    this._format = Session.DEFAULT_FORMAT
    this._scope = Session.DEFAULT_SCOPE
    this._channelOptions = {}
    this._tls = new TlsOptions()

    const self = this
    this._callOptions = function () {
      return {
        deadline: Date.now() + self.requestTimeoutInMillis
      }
    }
  }
}

/**
 * Options specific to the configuration of TLS.
 */
export class TlsOptions {
  /**
   * If `true`, prevents further mutations to the options.
   */
  private locked: boolean = false

  /**
   * Enable/disable TLS support.
   */
  private _enabled: boolean = false

  /**
   * The CA certificate paths (separated by ',').
   */
  private _caCertPath?: PathLike

  /**
   * The client certificate path.
   */
  private _clientCertPath?: PathLike

  /**
   * The client certificate key.
   */
  private _clientKeyPath?: PathLike

  /**
   * Returns `true` if TLS is to be enabled.
   *
   * @return `true` if TLS is to be enabled.
   */
  get enabled (): boolean {
    return this._enabled
  }

  /**
   * Enables/disables TLS support.
   *
   * @param value  `true` to enable TLS, otherwise `false` (default)
   */
  set enabled (value: boolean) {
    if (this.locked) {
      return;
    }
    this._enabled = value
  }

  /**
   * Return the configured CA certificate paths.
   *
   * @return the configured CA certificate paths, if any
   */
  get caCertPath (): PathLike | undefined {
    return this._caCertPath
  }

  /**
   * Sets the comma-delimited CA certificate paths.
   *
   * @param value  the comma-delimited CA certificate paths
   */
  set caCertPath (value: PathLike | undefined) {
    if (this.locked) {
      return;
    }
    this._caCertPath = value
  }

  /**
   * Return the client certificate path.
   *
   * @return the client certificate path, if any
   */
  get clientCertPath (): PathLike | undefined {
    return this._clientCertPath
  }

  /**
   * Sets the client certificate path.
   *
   * @param value the client certificate path, if any
   */
  set clientCertPath (value: PathLike | undefined) {
    if (this.locked) {
      return;
    }
    this._clientCertPath = value
  }

  /**
   * Returns the configured client certificate key path.
   *
   * @return the configured client certificate key path, if any
   */
  get clientKeyPath (): PathLike | undefined {
    return this._clientKeyPath
  }

  /**
   * Set the client certificate key path.
   *
   * @param value the client certificate key path
   */
  set clientKeyPath (value: PathLike | undefined) {
    if (this.locked) {
      return;
    }
    this._clientKeyPath = value
  }

  /**
   * Once called, no further mutations can be made.
   * @hidden
   */
  lock(): void {
    this.locked = true
  }
}

/**
 * Session represents a logical connection to an endpoint. It also
 * acts as a factory for creating caches.
 *
 * This class also extends EventEmitter and emits the following
 * events:
 * 1. {@link MapLifecycleEvent.DESTROYED}: when the underlying cache is destroyed
 * 2. {@link MapLifecycleEvent.TRUNCATED}: When the underlying cache is truncated
 * 3. {@link MapLifecycleEvent.RELEASED}: When the underlying cache is released
 * 4. {@link event.SessionLifecycleEvent.CONNECT}`: when the Session detects the underlying `gRPC` channel has connected.
 * 4. {@link event.SessionLifecycleEvent.DISCONNECT}`: when the Session detects the underlying `gRPC` channel has disconnected
 * 5. {@link event.SessionLifecycleEvent.DISCONNECT}`: when the Session detects the underlying `gRPC` channel has re-connected
 * 5. {@link event.SessionLifecycleEvent.CLOSED}`: when the Session has been closed
 */
export class Session
  extends EventEmitter {
  /**
   * The default target address to connect to Coherence gRPC server.
   */
  public static readonly DEFAULT_ADDRESS = 'localhost:1408'

  /**
   * The default request timeout.
   */
  public static readonly DEFAULT_REQUEST_TIMEOUT = 60000

  /**
   * The default `gRPC` stream ready timeout.
   */
  public static readonly DEFAULT_READY_TIMEOUT = 30000

  /**
   * The default scope.
   */
  public static readonly DEFAULT_SCOPE = ''

  /**
   * The default serialization format: 'json'
   */
  public static readonly DEFAULT_FORMAT = 'json'

  /**
   * Flag indicating if {@link close} has been invoked.
   */
  private markedForClose: boolean = false

  /**
   * Flag indicating the session has been closed.
   */
  private _closed: boolean = false

  /**
   * An internal cache using a composite key based on the cache name and serialization
   * format allowing the same cache instance to be used with different serialization formats.
   * that the keys are of the form <cache_name>:<serialization_format>.
   */
  private caches = new Map<string, NamedCacheClient>()

  /**
   * The {@link Options} used to create this {@link Session}.
   */
  private readonly _sessionOptions: Options

  /**
   * The gRPC ChannelCredentials to use.
   */
  private readonly _channelCredentials: ChannelCredentials

  /**
   * The gRPC Channel to use for all the {@link NamedCacheClient} that are created by this {@link Session}.
   */
  private readonly _channel: Channel

  /**
   * The set of options to use while creating a {@link NamedCacheClient}.
   */
  private readonly _clientOptions: object = {}

  /**
   * Promise that will resolve once the session has been closed.
   */
  private readonly sessionClosedPromise: Promise<boolean>

  /**
   * Construct a new `Session` based on the provided {@link Options}.
   *
   * @param sessionOptions  the {@link Options}
   */
  constructor (sessionOptions?: Options | object) {
    super()
    if (sessionOptions) {
      this._sessionOptions = Object.assign(new Options(), sessionOptions)
      // @ts-ignore  -- added for 'tls' index access
      this._sessionOptions.tls = Object.assign(new TlsOptions(), sessionOptions['tls'])
    } else {
      this._sessionOptions = new Options()
    }

    // If TLS is enabled then create an SSL channel credentials object.
    this._channelCredentials = this.options.tls.enabled
      ? credentials.createSsl(Session.readFile('caCert', this.options.tls.caCertPath),
        Session.readFile('clientKey', this.options.tls.clientKeyPath),
        Session.readFile('clientCert', this.options.tls.clientCertPath))
      : credentials.createInsecure()

    let channel = this._channel = new Channel(this.options.address,
                                              this.channelCredentials,
                                              this.options.channelOptions)

    // register handler to monitoring gRPC channel state.
    // When transitioning from READY to any other state, other than SHUTDOWN,
    // emit the `disconnect` event.
    // When transitioning from any other state,
    // other than SHUTDOWN, to READY, emit the 'reconnect' event.
    let connected: boolean = false;
    let firstConnect: boolean = true;
    let lastState: number = 0;
    let callback = async () => {
      let state = channel.getConnectivityState(false);
      lastState = state;
      if (state === ConnectivityState.SHUTDOWN) {
        // nothing to do
        return;
      } else if (state === ConnectivityState.READY) {
        if (!firstConnect && !connected) {
          this.emit(event.SessionLifecycleEvent.RECONNECTED)
          connected = true
        } else if (firstConnect && !connected){
          this.emit(event.SessionLifecycleEvent.CONNECTED)
          firstConnect = false
          connected = true
        }
      } else {
        if (connected) {
          this.emit(event.SessionLifecycleEvent.DISCONNECTED)
          connected = false;
        }
      }
      let deadline = Number.POSITIVE_INFINITY
      if (state !== ConnectivityState.READY) {
        deadline = Date.now() + this._sessionOptions.readyTimeoutInMillis
      }
      channel.watchConnectivityState(state, deadline, callback)
    }
    channel.watchConnectivityState(ConnectivityState.READY, Number.POSITIVE_INFINITY, callback)

    // channel will now be shared by all caches created by this session
    this._clientOptions = {
      channelOverride: channel
    }

    this.sessionClosedPromise = new Promise((resolve) => {
      const self = this
      const handler = function () {
        if (self.markedForClose && self.caches.size == 0) {
          self._closed = true
          resolve(true)
        }
      }
      self.on(event.MapLifecycleEvent.RELEASED, handler)
        .on(event.MapLifecycleEvent.DESTROYED, handler)
        .on(event.SessionLifecycleEvent.CLOSED, handler)
    })
    this._sessionOptions.lock()
  }

  /**
   * An internal method to read a cert file given its path.
   *
   * @param certType   the type of the certificate. Used only while creating an error message
   * @param nameOrURL  the path or URL to the cert
   *
   * @returns The {@link Buffer} containing the certificate.
   */
  private static readFile (certType: string, nameOrURL?: PathLike): Buffer {
    if (!nameOrURL) {
      throw new Error('When TLS is enabled, ' + certType + ' cannot be undefined or null')
    }
    return readFileSync(nameOrURL)
  }

  /**
   * Return the {@link Options} (read-only) used to configure this session.
   *
   * @return the {@link Options} (read-only) used to configure this session
   */
  get options (): Options {
    return this._sessionOptions
  }

  /**
   * Return the gRPC ChannelCredentials used by this session.
   *
   * @return the gRPC ChannelCredentials used by this session
   */
  get channelCredentials (): ChannelCredentials {
    return this._channelCredentials
  }

  /**
   * Return the scope name used to link this `Session` with to the corresponding
   * `ConfigurableCacheFactory` on the server.
   *
   * @return return the scope name used to link this `Session` with to the corresponding
   * `ConfigurableCacheFactory` on the server.
   */
  get scope (): string {
    return this._sessionOptions.scope
  }

  /**
   * Return the underlying `gRPC` Channel used by this session.
   *
   * @return the underlying `gRPC` Channel used by this session
   */
  get channel (): Channel {
    return this._channel
  }

  /**
   * Return the number of active caches created by this session.
   *
   * @return the number of active caches created by this session
   */
  get activeCacheCount (): number {
    return this.caches.size
  }

  /**
   * Returns an array of cache names for those caches that are currently active.
   *
   * @return an array of cache names for those caches that are currently active
   */
  get activeCaches (): Array<NamedCacheClient> {
    const array = new Array<NamedCacheClient>()
    for (const cache of this.caches.values()) {
      array.push(cache)
    }
    return array
  }

  /**
   * Return a `set` of cache names for those caches that are currently active.
   *
   * @return a `set` of cache names for those caches that are currently active
   */
  get activeCacheNames (): Set<string> {
    const set = new Set<string>()
    for (const cache of this.caches.values()) {
      set.add(cache.name)
    }
    return set
  }

  /**
   * Return the client options used to configure this session.
   *
   * @return the client options used to configure this session
   * @internal
   */
  get clientOptions (): object {
    return this._clientOptions
  }

  /**
   * This is an alias for `Session.options.address`.
   *
   * @return the IPv4 host address and port in the format of `[host]:[port]`
   */
  get address (): string {
    return this._sessionOptions.address
  }

  /**
   * This is a shortcut to invoke the {@link Session options callOptions} function.
   *
   * @return the gRPC CallOptions that will be applied to each request made using this session
   */
  callOptions (): CallOptions {
    return this._sessionOptions.callOptions()
  }

  /**
   * Returns a {@link NamedCacheClient} for the specified cache name. This class
   * maintains an internal cache (a Map) and if a {@link NamedCacheClient} exists
   * in the cache it is returned. Else a new {@link NamedCacheClient} is created
   * (then cached) and returned.
   *
   * @param name    the cache name
   * @param format  the serialization format for keys and values stored within the cache
   */
  getCache<K, V> (name: string, format: string = Session.DEFAULT_FORMAT): NamedCache<K, V> {
    if (this.markedForClose) {
      throw new Error('Session is closing')
    }
    if (this._closed) {
      throw new Error('Session has been closed')
    }

    const cacheKey = Session.makeCacheKey(name, format)
    const serializer = util.SerializerRegistry.instance().serializer(format)

    let namedCache = this.caches.get(cacheKey)
    if (!namedCache) {
      namedCache = new NamedCacheClient(name, this, serializer)
      this.setupEventHandlers(namedCache)
      this.caches.set(cacheKey, namedCache)
    }

    return namedCache
  }

  getMap<K, V> (name: string, format: string = Session.DEFAULT_FORMAT): NamedMap<K, V> {
    return this.getCache(name, format) as NamedMap<K, V>
  }

  /**
   * Close the {@link Session}.
   */
  async close (): Promise<void> {
    if (this.markedForClose) {
      return
    }

    this.markedForClose = true
    for (const entry of this.caches.entries()) {
      await entry[1].release()
    }
    this._channel.close()

    this.emit(event.SessionLifecycleEvent.CLOSED)
    return Promise.resolve()
  }

  /**
   * Returns `true` if the session is closed.
   *
   * @return `true` if the session is closed
   */
  get closed (): boolean {
    return this._closed
  }

  /**
   * Returns a promise that will resolve to `true` once the session has been closed.
   *
   * @return a promise that will resolve to `true` once the session has been closed
   */
  waitUntilClosed (): Promise<boolean> {
    return this.sessionClosedPromise
  }

  /**
   * Create a composite key based on the provided cache name and serialization format.
   *
   * @param cacheName  the cache name
   * @param format     the serialization format
   *
   * @return a composite key based on the provided cache name and serialization format
   */
  private static makeCacheKey (cacheName: string, format: string): string {
    return cacheName + ':' + format
  }

  /**
   * Returns `true` if the key contains the given cache name.
   *
   * @param key        the internal cache key
   * @param cacheName  the name of the cache
   *
   * @return `true` if the key contains the given cache name
   * @private
   */
  private static isKeyForCacheName (key: string, cacheName: string): boolean {
    return key.startsWith(cacheName + ':')
  }

  /**
   * Attach event handlers to the given cache.
   *
   * @param cache  the cache to attach event handlers to
   * @private
   */
  private setupEventHandlers (cache: NamedCacheClient) {
    const self = this
    cache.on(event.MapLifecycleEvent.DESTROYED, (cacheName: string) => {
      // Our keys in caches Map are of the form cacheName:format.
      // We will destroy all caches whose key starts with 'cacheName:'
      for (const key of self.caches.keys()) {
        if (Session.isKeyForCacheName(key, cacheName)) {
          self.caches.delete(key)
          self.emit(event.MapLifecycleEvent.DESTROYED, cacheName)
        }
      }
    })

    cache.on(event.MapLifecycleEvent.RELEASED, (cacheName: string, format: string) => {
      self.caches.delete(Session.makeCacheKey(cacheName, format))
      self.emit(event.MapLifecycleEvent.RELEASED, cacheName, format)
    })
  }
}
