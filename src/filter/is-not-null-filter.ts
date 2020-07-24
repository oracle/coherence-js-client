/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ValueExtractor } from '@extractor/value-extractor'
import { NotEqualsFilter } from './not_equals_filter'

export class IsNotNullFilter<T = any, E = any>
  extends NotEqualsFilter<T, E | null> {
  constructor (extractor: ValueExtractor<T, E>) {
    super('IsNotNullFilter', extractor, null)
  }
}
