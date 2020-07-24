/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { MapEventResponse } from '../cache/proto/messages_pb'
import { ObservableMap } from '../util/observable_map'
import { Serializer } from '../util/serializer'

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
   * The name of cache from which the event originated.
   */
  cacheName: string

  /**
   * The event source.
   */
  source: ObservableMap<K, V>

  /**
   * Event id; may be one of {@link ENTRY_INSERTED}, {@link ENTRY_UPDATED}, or {@link ENTRY_DELETED}.
   */
  id: number

  /**
   * Serialized representation of the cache key associated with this event.
   */
  keyBytes: Uint8Array

  /**
   * Serialized representation of the new cache value associated with this event.
   */
  newValueBytes?: Uint8Array

  /**
   * Serialized representation of the old cache value associated with this event.
   */
  oldValueBytes?: Uint8Array

  /**
   * The deserialized key.
   */
  private key?: K

  /**
   * The deserialized new value.
   */
  private newValue?: V

  /**
   * The deserialized old value.
   */
  private oldValue?: V

  /**
   * Array of filter IDs applied to this event.
   * TODO(rlubke) not used - should it be?
   */
  private readonly filterIDs: Array<number>

  /**
   * The {@link Serializer} to use to deserialize in-bound `MapEvents`.
   */
  private serializer: Serializer

  /**
   * Constructs a new `MapEvent`
   *
   * @param cacheName  the name of the cache the generated the event
   * @param source     the event source
   * @param mapEvent   the {@link MapEventResponse} from the server
   * @param serializer
   */
  constructor (cacheName: string, source: ObservableMap<K, V>, mapEvent: MapEventResponse, serializer: Serializer) {
    this.cacheName = cacheName
    this.source = source
    this.serializer = serializer
    this.id = mapEvent.getId()
    this.keyBytes = mapEvent.getKey_asU8()
    this.newValueBytes = mapEvent.getNewvalue_asU8()
    this.oldValueBytes = mapEvent.getOldvalue_asU8()
    this.filterIDs = mapEvent.getFilteridsList()
  }

  /**
   * Return the cache name from which the event originated.
   *
   * @return the cache name from which the event originated
   */
  getName (): string {
    return this.cacheName
  }

  /**
   * Return the event source.
   *
   * @return the event source
   */
  getSource (): ObservableMap<K, V> {
    return this.source
  }

  /**
   * Return the event ID.
   * This may be one of:
   * - {@link MapEvent.ENTRY_INSERTED}
   * - {@link MapEvent.ENTRY_UPDATED}
   * - {@link MapEvent.ENTRY_DELETED}
   *
   * @return the event ID
   */
  getId (): number {
    return this.id
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
  getDescription (): string {
    return MapEvent.getDescription(this.id)
  }

  /**
   * Return the key for the entry generating the event.
   *
   * @return the key for the entry generating the event
   */
  getKey (): K {
    if (!this.key) {
      this.key = this.serializer.deserialize(this.keyBytes)
    }
    if (!this.key) {
      throw new Error('unable to deserialize key using format: ' + this.serializer.format())
    }
    return this.key
  }

  /**
   * Return the old value for the entry generating the event.
   *
   * @return the old value, if any, for the entry generating the event
   */
  getOldValue (): V | undefined {
    if (!this.oldValue && this.oldValueBytes) {
      this.oldValue = this.serializer.deserialize(this.oldValueBytes)
    }
    return this.oldValue
  }

  /**
   * Return the new value for the entry generating the event.
   *
   * @return the new value, if any, for the entry generating the event
   */
  getNewValue (): V | undefined {
    if (!this.newValue && this.newValueBytes) {
      this.newValue = this.serializer.deserialize(this.newValueBytes)
    }
    return this.newValue
  }

  // ----- helper methods ---------------------------------------------------

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
        return 'inserted'

      case MapEvent.ENTRY_UPDATED:
        return 'updated'

      case MapEvent.ENTRY_DELETED:
        return 'deleted'

      default:
        return '<unknown: ' + eventId + '>'
    }
  }
}
