/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { BaseProcessor } from './base_processor';
import { Filter } from '../filter/filter';

/**
 * Put entry processor.
 *
 * @param <K> the type of the Map entry key
 * @param <V> the type of the Map entry value
 */
export class GetProcessor<K=any, V=any>
    extends BaseProcessor<K, V, void> {

    /**
     * Construct a Get EntryProcessor.
     *
     * @param filter  the filter to evaluate an entry
     * @param value   a value to update an entry with
     */
    constructor() {
        super('Get');
    }

}
