/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { MapEvent } from './map_event'

export interface MapListener<K = any, V = any> {

  entryDeleted (event: MapEvent<K, V>): void;

  entryInserted (event: MapEvent<K, V>): void;

  entryUpdated (event: MapEvent<K, V>): void;

}

export interface MapLifecycleListener<K = any, V = any> {

  mapTruncated (mapName: string): void;

  mapDestroyed (mapName: string): void;

  mapListenerChannelOpened (mapName: string): void;

  mapListenerChannelClosed (mapName: string): void;

}

export class MapListenerAdapter<K = any, V = any>
  implements MapListener<K, V> {
  entryDeleted (event: MapEvent<K, V>): void {
  }

  entryInserted (event: MapEvent<K, V>): void {
  }

  entryUpdated (event: MapEvent<K, V>): void {
  }
}

export class MapLifecycleListenerAdapter<K = any, V = any>
  implements MapLifecycleListener<K, V> {
  mapTruncated (mapName: string): void {
  }

  mapDestroyed (mapName: string): void {
  }

  mapListenerChannelOpened (mapName: string): void {
  }

  mapListenerChannelClosed (mapName: string): void {
  }
}
