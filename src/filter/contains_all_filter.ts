/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ValueExtractor } from '../extractor/value_extractor'
import { ComparisonFilter } from './filter'

export class ContainsAllFilter<T = any, E = any>
  extends ComparisonFilter<T, E, any> {
  constructor (extractor: ValueExtractor<T, E>, setValues: any) {
    super('ContainsAllFilter', extractor, setValues)
  }
}
