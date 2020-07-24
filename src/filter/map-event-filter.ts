/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { Filter } from '.'
import { internal } from './package-internal'

/**
 * Filter which evaluates the content of a MapEvent object according to the
 * specified criteria.  This filter is intended to be used by various
 * {@link ObservableMap} listeners that are interested in particular subsets
 * of MapEvent notifications emitted by the map.
 * <p>
 * Usage examples:
 * <ul>
 * <li>a filter that evaluates to true if an Employee object is inserted into
 *     a cache with a value of Married property set to true.
 * <pre>
 *   new MapEventFilter(MapEventFilter.E_INSERT,
 *       new EqualsFilter("isMarried", Boolean.TRUE));
 * </pre>
 * <li>a filter that evaluates to true if any object is removed from a cache.
 * <pre>
 *   new MapEventFilter(MapEventFilter.E_DELETED);
 * </pre>
 * <li>a filter that evaluates to true if there is an update to an Employee
 *     object where either an old or new value of LastName property equals to
 *     "Smith"
 * <pre>
 *   new MapEventFilter(MapEventFilter.E_UPDATED,
 *       new EqualsFilter("LastName", "Smith"));
 * </pre>
 * <li>a filter that is used to keep a cached keySet result based on some map
 *     filter up-to-date.
 * <pre>
 *   final Set    setKeys   = new HashSet();
 *   final Filter filterEvt = new MapEventFilter(filterMap);
 *   MapListener  listener  = new AbstractMapListener()
 *       {
 *       public void entryInserted(MapEvent evt)
 *           {
 *           setKeys.add(evt.getKey());
 *           }
 *
 *       public void entryDeleted(MapEvent evt)
 *           {
 *           setKeys.remove(evt.getKey());
 *           }
 *       };
 *
 *   map.addMapListener(listener, filterEvt, true);
 *   setKeys.addAll(map.keySet(filterMap));
 * </pre>
 * </ul>
 *
 * @see ValueChangeEventFilter
 *
 */
export class MapEventFilter<T = any>
  extends Filter<T> {
  /**
   * This value indicates that {@link MapEvent#ENTRY_INSERTED
     * ENTRY_INSERTED} events should be evaluated. The event will be fired if
   * there is no filter specified or the filter evaluates to true for a new
   * value.
   */
  static E_INSERTED = 0x0001
  /**
   * This value indicates that {@link MapEvent#ENTRY_UPDATED ENTRY_UPDATED}
   * events should be evaluated. The event will be fired if there is no
   * filter specified or the filter evaluates to true when applied to either
   * old or new value.
   */
  static E_UPDATED = 0x0002
  /**
   * This value indicates that {@link MapEvent#ENTRY_DELETED ENTRY_DELETED}
   * events should be evaluated. The event will be fired if there is no
   * filter specified or the filter evaluates to true for an old value.
   */
  static E_DELETED = 0x0004
  /**
   * This value indicates that {@link MapEvent#ENTRY_UPDATED ENTRY_UPDATED}
   * events should be evaluated, but only if filter evaluation is false for
   * the old value and true for the new value. This corresponds to an item
   * that was not in a keySet filter result changing such that it would now
   * be in that keySet filter result.
   *
   * @since Coherence 3.1
   */
  static E_UPDATED_ENTERED = 0x0008
  /**
   * This value indicates that {@link MapEvent#ENTRY_UPDATED ENTRY_UPDATED}
   * events should be evaluated, but only if filter evaluation is true for
   * the old value and false for the new value. This corresponds to an item
   * that was in a keySet filter result changing such that it would no
   * longer be in that keySet filter result.
   *
   * @since Coherence 3.1
   */
  static E_UPDATED_LEFT = 0x0010
  /**
   * This value indicates that {@link MapEvent#ENTRY_UPDATED ENTRY_UPDATED}
   * events should be evaluated, but only if filter evaluation is true for
   * both the old and the new value. This corresponds to an item
   * that was in a keySet filter result changing but not leaving the keySet
   * filter result.
   *
   * @since Coherence 3.1
   */
  static E_UPDATED_WITHIN = 0x0020
  /**
   * This value indicates that all events should be evaluated.
   */
  static E_ALL = MapEventFilter.E_INSERTED | MapEventFilter.E_UPDATED |
    MapEventFilter.E_DELETED

  /**
   * This value indicates that all events that would affect the result of
   * a {@link com.tangosol.util.QueryMap#keySet(com.tangosol.util.Filter)}
   * query should be evaluated.
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
