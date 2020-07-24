/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { internal } from './package-internal'
import {  ValueExtractor } from './value-extractor'

export class UniversalExtractor<T = any, E = any>
  extends ValueExtractor<T, E> {
  name: string

  params?: any[]

  constructor (name: string, params?: any[]) {
    super(internal.extractorName('UniversalExtractor'))
    this.name = name
    if (params) {
      this.params = params
    }
  }
}
