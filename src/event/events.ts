/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */


export const enum CacheLifecycleEvent {
  DESTROYED = 'cache_destroyed',
  TRUNCATED = 'cache_truncated',
  RELEASED = 'cache_released'
}

/**
 * @internal
 */
export const enum RequestStateEvent {
  DATA = 'data',
  COMPLETE = 'end',
  ERROR = 'error'
}

export const enum SessionLifecycleEvent {
  ESTABLISHED= 'session_established',
  CLOSED = 'session_closed'
}