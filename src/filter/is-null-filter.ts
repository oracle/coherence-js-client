/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ValueExtractor } from '../extractor/'
import { EqualsFilter } from '.'
import { internal } from './package-internal'

export class IsNullFilter<T = any, E = any>
  extends EqualsFilter<T, E | null> {
  constructor (extractor: ValueExtractor<T, E>) {
    super(extractor, null)
    this['@class'] = internal.filterName('IsNullFilter')
  }
}
