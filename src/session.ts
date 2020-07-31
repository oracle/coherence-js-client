/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { CacheLifecycleEvent, SessionLifecycleEvent } from './event/events'
import { NamedCache, NamedMap } from './net' // SessionLifecycleEvent not exported
import { SerializerRegistry } from './util'
import { EventEmitter } from 'events'
import { PathLike, readFileSync } from 'fs'
import { Channel, ChannelCredentials, credentials } from 'grpc'

import { NamedCacheClient } from './named-cache-client'

/**
 * A builder for {@link Session | sessions}.
 */
export class SessionBuilder {
  /**
   * The {@link SessionOptions} to use when creating a Session.
   */
  private readonly sessionOptions: SessionOptions

  /**
   * Create a SessionBuilder.
   */
  constructor () {
    this.sessionOptions = new SessionOptions()
  }

  /**
   * Set the target address to establish a session with.
   *
   * @param address  the target address to establish a session with
   *
   * @return this
   */
  withAddress (address: string): this {
    this.sessionOptions.address = address
    return this
  }

  /**
   * The maximum timeout, in milliseconds, for a request to complete.
   *
   * @param requestTimeoutInMillis  the maximum timeout, in milliseconds, for a request to complete
   *
   * @return this
   */
  withRequestTimeout (requestTimeoutInMillis: number): this {
    this.sessionOptions.requestTimeoutInMillis = requestTimeoutInMillis
    return this
  }

  /**
   * Enable TLS.
   * <p>
   * When TLS is set, {@link withCaCert}, {@link withClientCert} and {@link withClientKey} must also be called.
   *
   * @return this
   */
  enableTls (): this {
    this.sessionOptions.tlsEnabled = true
    return this
  }

  /**
   * Disable TLS.
   *
   * @return this
   */
  disableTls (): this {
    this.sessionOptions.tlsEnabled = false
    return this
  }

  /**
   * Set the CA certificate path.
   *
   * @param caCertPath  the CA certificate path
   *
   * @return this
   */
  withCaCert (caCertPath: PathLike): this {
    this.sessionOptions.caCertPath = caCertPath
    return this
  }

  /**
   * Set the client certificate path.
   *
   * @param clientCertPath  the client certificate path
   *
   * @return this
   */
  withClientCert (clientCertPath: PathLike): this {
    this.sessionOptions.clientCertPath = clientCertPath
    return this
  }

  /**
   * Set the client private key path.
   *
   * @param clientKeyPath  the client private key path
   *
   * @return this
   */
  withClientKey (clientKeyPath: PathLike): this {
    this.sessionOptions.clientKeyPath = clientKeyPath
    return this
  }

  /**
   * Set the default serialization format.  If not explicitly configured, this
   * will default to {@link Session.DEFAULT_FORMAT}.
   *
   * @param format the default serialization format for this session
   *
   * @return this
   */
  withFormat (format: string): this {
    this.sessionOptions.format = format
    return this
  }

  /**
   * Returns a new session based on the current builder configuration.
   *
   * @returns a new session based on the current builder configuration
   */
  build (): Session {
    return new Session(new SessionOptions(this.sessionOptions))
  }

  /**
   * Return a copy of the session configuration options.
   *
   * @return a copy of the session configuration options
   */
  getSessionOptions (): SessionOptions {
    return new SessionOptions(this.sessionOptions)
  }
}

/**
 * An internal class for holding various options
 * for creating a {@link Session}
 *
 * @internal
 */
export class SessionOptions {
  /**
   * Address of the target NamedCache server.
   * @default localhost:1408.
   */
  address: string = Session.DEFAULT_ADDRESS

  /**
   * An option to define a Timeout for each call.
   * @default 60000 millis
   * @type {number}
   */
  requestTimeoutInMillis: number = 60000

  /**
   * The IPv4 address of the Cloud Collections gRPC server.
   *
   * @default [process.env.TLS_ENABLED || false]
   */
  tlsEnabled = SessionOptions.toBoolean(process.env.TLS_ENABLED) || false

  /**
   * The CA certificate paths (separated by ',').
   */
  caCertPath?: PathLike

  /**
   * The client certificate path.
   */
  clientCertPath?: PathLike

  /**
   * The client certificate key.
   */
  clientKeyPath?: PathLike

  /**
   * The serialization format.
   */
  format: string = Session.DEFAULT_FORMAT

  /**
   * Construct a new {@link SessionOptions} instance with either default values or a copy of an existing instance.
   *
   * @param sessionOptions  the optional {@link SessionOptions} to create a copy of
   */
  constructor (sessionOptions?: SessionOptions) {
    if (sessionOptions) {
      this.address = sessionOptions.address
      this.tlsEnabled = sessionOptions.tlsEnabled
      this.requestTimeoutInMillis = sessionOptions.requestTimeoutInMillis
      this.caCertPath = sessionOptions.caCertPath
      this.clientCertPath = sessionOptions.clientCertPath
      this.clientKeyPath = sessionOptions.clientKeyPath
      this.format = sessionOptions.format
    }
  }

  /**
   * Utility method for determining `truthiness`.
   *
   * @param value the value to test
   */
  static toBoolean (value?: string | number | boolean): boolean {
    return value ? [true, 'true', 'True', 'TRUE', '1', 1].includes(value) : false
  }
}

/**
 * Session represents a logical connection to an endpoint. It also
 * acts as a factory for creating caches.
 *
 * This class also extends EventEmitter and emits the following
 * events:
 * 1. {@link CacheLifecycleEvent.DESTROYED}: when the underlying cache is destroyed
 * 2. {@link CacheLifecycleEvent.TRUNCATED}: When the underlying cache is truncated
 * 3. {@link CacheLifecycleEvent.RELEASED}: When the underlying cache is released
 */
export class Session
  extends EventEmitter {
  /**
   * The default target address to connect to Coherence gRPC server.
   */
  public static readonly DEFAULT_ADDRESS = 'localhost:1408'

  /**
   * The default serialization format: 'json'
   */
  public static readonly DEFAULT_FORMAT = 'json'

  /**
   * Flag indicating if {@link .close} has been invoked.
   */
  private markedForClose: boolean = false

  /**
   * Flag indicating the session has been closed.
   */
  private closed: boolean = false

  /**
   * An internal cache using a composite key based on the cache name and serialization
   * format allowing the same cache instance to be used with different serialization formats.
   * that the keys are of the form <cache_name>:<serialization_format>.
   */
  private caches = new Map<string, NamedCacheClient>()

  /**
   * The {@link SessionOptions} used to create this {@link Session}.
   */
  private readonly sessionOptions: SessionOptions

  /**
   * The {@link ChannelCredentials} to use.
   */
  private readonly channelCredentials: ChannelCredentials

  /**
   * The {@link Channel} to use for all the {@link NamedCacheClient} that are created by this {@link Session}.
   */
  private readonly channel: Channel

  /**
   * The set of options to use while creating a {@link Channel}.
   * <p>
   * Review the `gRPC` channel argument key
   * [documentation](https://grpc.github.io/grpc/core/group__grpc__arg__keys.html) to obtain a list of possible options.
   */
  private readonly channelOptions: { [key: string]: string | number } = {}

  /**
   * The set of options to use while creating a {@link NamedCacheClient}.
   */
  private readonly clientOptions: object = {}

  /**
   * Promise that will resolve once the session has been closed.
   */
  private readonly sessionClosedPromise: Promise<boolean>

  /**
   * Construct a new `Session` based on the provided {@link SessionOptions}.
   *
   * @param sessionOptions  the {@link SessionOptions}
   */
  constructor (sessionOptions: SessionOptions) {
    super()
    this.sessionOptions = sessionOptions

    // If TLS is enabled then create a SSL channel credentials object.
    this.channelCredentials = this.sessionOptions.tlsEnabled
      ? credentials.createSsl(Session.readFile('caCert', this.sessionOptions.caCertPath),
                              Session.readFile('clientKey', this.sessionOptions.clientKeyPath),
                              Session.readFile('clientCert', this.sessionOptions.clientCertPath))
      : credentials.createInsecure()

    this.channelOptions = {
      // Interceptors can be specified here....
    }

    this.channel = new Channel(this.sessionOptions.address, this.channelCredentials, this.channelOptions)

    // channel will now be shared by all caches created by this session
    this.clientOptions = {
      channelOverride: this.channel
    }

    const self = this
    this.sessionClosedPromise = new Promise((resolve) => {
      self.on(CacheLifecycleEvent.RELEASED, () => {
        if (self.markedForClose && self.caches.size == 0) {
          self.closed = true
          resolve(true)
        }
      })
      self.on(CacheLifecycleEvent.DESTROYED, () => {
        if (self.markedForClose && self.caches.size == 0) {
          self.closed = true
          resolve(true)
        }
      })
      self.on(SessionLifecycleEvent.CLOSED, () => {
        if (self.markedForClose && self.caches.size == 0) {
          self.closed = true
          resolve(true)
        }
      })
    })
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
   * Return the {@link SessionOptions} used to configure this session.
   *
   * @return the {@link SessionOptions} used to configure this session
   */
  getSessionOptions (): SessionOptions {
    return new SessionOptions(this.sessionOptions)
  }

  /**
   * Return the address of the target host of this session.
   *
   * @return the address of the target host of this session
   */
  getAddress (): string {
    return this.sessionOptions.address
  }

  /**
   * Return the {@link ChannelCredentials} used by this session.
   *
   * @return the {@link ChannelCredentials} used by this session
   */
  getChannelCredentials (): ChannelCredentials {
    return this.channelCredentials
  }

  /**
   * Return the underlying `gRPC` Channel used by this session.
   *
   * @return the underlying `gRPC` Channel used by this session
   */
  getChannel (): Channel {
    return this.channel
  }

  /**
   * Return the number of active caches created by this session.
   *
   * @return the number of active caches created by this session
   */
  getActiveCacheCount (): number {
    return this.caches.size
  }

  /**
   * Returns an array of cache names for those caches that are currently active.
   *
   * @return an array of cache names for those caches that are currently active
   */
  getActiveCaches (): Array<NamedCacheClient> {
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
  getActiveCacheNames (): Set<string> {
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
   */
  getClientOptions (): object {
    return this.clientOptions
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
  getCache<K, V> (name: string, format: string=Session.DEFAULT_FORMAT): NamedCache<K, V> {
    if (this.markedForClose) {
      throw new Error('Session is closing')
    }
    if (this.closed) {
      throw new Error('Session has been closed')
    }

    const cacheKey = Session.makeCacheKey(name, format)
    const serializer = SerializerRegistry.instance().serializer(format)

    let namedCache = this.caches.get(cacheKey)
    if (!namedCache) {
      namedCache = new NamedCacheClient(name, this, serializer)
      this.setupEventHandlers(namedCache)
      this.caches.set(cacheKey, namedCache)
    }

    return namedCache
  }

  getMap<K, V> (name: string, format: string=Session.DEFAULT_FORMAT): NamedMap<K, V> {
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
    this.channel.close()

    this.emit(SessionLifecycleEvent.CLOSED)
    return Promise.resolve()
  }

  /**
   * Returns `true` if the session is closed.
   *
   * @return `true` if the session is closed
   */
  isClosed (): boolean {
    return this.closed
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
    cache.on(CacheLifecycleEvent.DESTROYED, (cacheName: string) => {
      // Our keys in caches Map are of the form cacheName:format.
      // We will destroy all caches whose key starts with 'cacheName:'
      for (const key of self.caches.keys()) {
        if (Session.isKeyForCacheName(key, cacheName)) {
          self.caches.delete(key)
          self.emit(CacheLifecycleEvent.DESTROYED, cacheName)
        }
      }
    })

    cache.on(CacheLifecycleEvent.RELEASED, (cacheName: string, format: string) => {
      self.caches.delete(Session.makeCacheKey(cacheName, format))
      self.emit(CacheLifecycleEvent.RELEASED, cacheName, format)
    })
  }
}
