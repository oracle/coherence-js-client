/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { Filter } from '.'
import { MapEvent } from '../event'
import { internal } from './package-internal'

/**
 * Filter which evaluates the content of a MapEvent object according to the
 * specified criteria.  This filter is intended to be used by various
 * map listeners that are interested in particular subsets
 * of MapEvent notifications emitted by the map.
 */
export class MapEventFilter<K, V>
  extends Filter<MapEvent<K, V>> {
  /**
   * This value indicates that insert events should be evaluated. The event will be fired if
   * there is no filter specified or the filter evaluates to true for a new
   * value.
   */
  static E_INSERTED = 0x0001

  /**
   * This value indicates that update events should be evaluated. The event will be fired if
   * there is no filter specified or the filter evaluates to true when applied to either
   * old or new value.
   */
  static E_UPDATED = 0x0002

  /**
   * This value indicates that delete events should be evaluated. The event will be fired if
   * there is no filter specified or the filter evaluates to true for an old value.
   */
  static E_DELETED = 0x0004

  /**
   * This value indicates that update events should be evaluated, but only if filter
   * evaluation is `false` for the old value and true for the new value. This corresponds to an item
   * that was not in a keySet filter result changing such that it would now
   * be in that keySet filter result.
   */
  static E_UPDATED_ENTERED = 0x0008

  /**
   * This value indicates that update events should be evaluated, but only if filter
   * evaluation is `true` for the old value and false for the new value. This corresponds to an item
   * that was in a keySet filter result changing such that it would no
   * longer be in that keySet filter result.
   */
  static E_UPDATED_LEFT = 0x0010

  /**
   * This value indicates that update events should be evaluated, but only if filter
   * evaluation is true for both the old and the new value. This corresponds to an item
   * that was in a keySet filter result changing but not leaving the keySet
   * filter result.
   */
  static E_UPDATED_WITHIN = 0x0020

  /**
   * This value indicates that all events should be evaluated.
   */
  static E_ALL = MapEventFilter.E_INSERTED | MapEventFilter.E_UPDATED |
    MapEventFilter.E_DELETED

  /**
   * This value indicates that all events that would affect the result of
   * a NamedMap.keySet(Filter) query should be evaluated.
   *
   * @since Coherence 3.1
   */
  static E_KEYSET = MapEventFilter.E_INSERTED | MapEventFilter.E_DELETED |
    MapEventFilter.E_UPDATED_ENTERED | MapEventFilter.E_UPDATED_LEFT

  /**
   * The event mask.
   */
  mask: number

  /**
   * The event value(s) filter.
   */
  filter?: Filter | undefined | null

  /**
   * Construct a MapEventFilter that evaluates MapEvent objects
   * based on the specified combination of event types.
   *
   * @param maskOrFilter  combination of any of the E_* values or the filter passed previously to a keySet() query method
   * @param filter        the filter used for evaluating event values
   */
  constructor (maskOrFilter: number | Filter, filter?: Filter) {
    super(internal.filterName('MapEventFilter'))
    if (filter) {
      // Two arg invocation.
      this.mask = maskOrFilter as number
      this.filter = filter
    } else {
      // One arg invocation.
      if (maskOrFilter instanceof Filter) {
        this.mask = MapEventFilter.E_KEYSET
        this.filter = maskOrFilter
      } else {
        this.mask = maskOrFilter
        this.filter = null
      }
    }
  }
}
