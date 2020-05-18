/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ValueExtractor } from '../extractor/value_extractor';
import { ComparisonFilter } from './filter';
import { EqualsFilter } from './equals_filter';

export class IsNullFilter<T=any, E=any>
    extends EqualsFilter<T, E | null> {

    constructor(extractor: ValueExtractor<T, E>) {
        super('IsNullFilter', extractor, null);
    }
}