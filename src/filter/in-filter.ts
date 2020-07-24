/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ValueExtractor } from '../extractor/'
import { ComparisonFilter } from '.'
import { internal } from './package-internal'

export class InFilter<T = any, E = any>
  extends ComparisonFilter<T, E, E[]> {
  constructor (extractor: ValueExtractor<T, E>, setValues: Set<E>) {
    super(internal.filterName('InFilter'), extractor, Array.from(setValues))
  }
}
