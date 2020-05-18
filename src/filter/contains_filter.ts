/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ComparisonFilter } from './filter';
import { ValueExtractor } from '../extractor/value_extractor';

export class ContainsFilter<T=any, E=any>
    extends ComparisonFilter<T, E, E> {

    values: any;

    constructor(extractor: ValueExtractor<T, E | E[]>, value: E) {
        super('ContainsFilter', extractor, value);
    }
}