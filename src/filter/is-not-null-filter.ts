/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ValueExtractor } from '../extractor/'
import { NotEqualsFilter } from '.'
import { internal } from './package-internal'

export class IsNotNullFilter<T = any, E = any>
  extends NotEqualsFilter<T, E | null> {
  constructor (extractor: ValueExtractor<T, E>) {
    super(internal.filterName('IsNotNullFilter'), extractor, null)
  }
}
