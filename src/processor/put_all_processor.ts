/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { BaseProcessor } from './base_processor';
import { Filter } from '../filter/filter';

/**
 * PutAll entry processor.
 *
 * @param <K> the type of the Map entry key
 * @param <V> the type of the Map entry value
 */
export class PutAllProcessor<K, V>
    extends BaseProcessor<K, V, void> {

    /**
     * Specifies the new value to update an entry with.
     */
    entries: Map<K, V>;

    /**
     * Construct a PutAll EntryProcessor.
     *
     * @param filter  the filter to evaluate an entry
     * @param value   a value to update an entry with
     */
    constructor(entries: Map<K, V>) {
        super('PutAll');

        this.entries = entries;
    }

}
