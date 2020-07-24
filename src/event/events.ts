/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

/**
 * Cache lifecycle events.
 */
export enum CacheLifecycleEvent {
  /**
   * Raised when a cache is destroyed.
   */
  DESTROYED = 'cache_destroyed',

  /**
   * Raised when a cache is truncated.
   */
  TRUNCATED = 'cache_truncated',

  /**
   * Raised when a cache is released.
   */
  RELEASED = 'cache_released'
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
  CLOSED = 'session_closed'
}
