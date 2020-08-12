/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { MapEvent } from '.'

/**
 * The listener interface for receiving {@link MapEvent}s.
 *
 * @typeParam  K  the type of the cache entry keys
 * @typeParam  V  the type of the cache entry values
 */
export interface MapListener<K, V> {

  /**
   * Invoked when a map entry has been removed.
   *
   * @param event  the {@link MapEvent} carrying the delete information
   */
  entryDeleted (event: MapEvent<K, V>): void;

  /**
   * Invoked when a map entry has been inserted.
   *
   * @param event  the {@link MapEvent} carrying the insert information
   */
  entryInserted (event: MapEvent<K, V>): void;

  /**
   * Invoked when a map entry has been updated.
   *
   * @param event  the {@link MapEvent} carrying the update information
   */
  entryUpdated (event: MapEvent<K, V>): void;
}

/**
 * A simple {@link MapListener} implementation allowing developers to extend and
 * implement only what they need.
 */
export class MapListenerAdapter<K = any, V = any>
  implements MapListener<K, V> {
  entryDeleted (event: MapEvent<K, V>): void {
  }

  entryInserted (event: MapEvent<K, V>): void {
  }

  entryUpdated (event: MapEvent<K, V>): void {
  }
}
