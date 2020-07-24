/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ValueExtractor } from '@extractor/value-extractor'
import { ComparisonFilter } from './filter'

export class EqualsFilter<T = any, E = any>
  extends ComparisonFilter<T, E, E> {
  constructor (typeName: string = 'EqualsFilter', extractor: ValueExtractor<T, E>, value: E) {
    super(typeName, extractor, value)
  }
}
