/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { BaseProcessor } from './base_processor';
import { Filter } from '../filter/filter';
import { MapHolder } from './base_processor';

export class ConditionalPutAllProcessor<K=any, V=any>
    extends BaseProcessor<K, V, V> {

    /**
     * The underlying filter.
     */
    filter: Filter<V>;

    /**
     * Specifies the new value to update an entry with.
     */
    entries: MapHolder<K, V>;
 
    /**
     * Construct a ConditionalPutAll processor that updates an entry with a
     * new value if and only if the filter applied to the entry evaluates to
     * true. The new value is extracted from the specified map based on the
     * entry's key.
     *
     * @param filter  the filter to evaluate all supplied entries
     * @param map     a map of values to update entries with
     */
    constructor(filter: Filter<V>, entries: Map<K, V>) {
        super('ConditionalPutAll');

        this.filter = filter;
        this.entries = new MapHolder(entries);
    }

}

