/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { MapEventFilter } from '../filter/map_event_filter'
import { MapListener } from './map_listener'

export interface ObservableMap<K = any, V = any> {

  on (event_name: 'cache_truncated' | 'cache_destroyed', handler: (cacheName: string) => void): void;

  addMapListener (listener: MapListener<K, V>, isLite?: boolean): void;

  addMapListener (listener: MapListener<K, V>, key: K, isLite?: boolean): void;

  addMapListener (listener: MapListener<K, V>, filter: MapEventFilter, isLite?: boolean): void;
}
