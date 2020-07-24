/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ValueExtractor } from '@extractor/value-extractor'
import { ComparisonFilter } from './filter'

export class LikeFilter<T = any, E = any>
  extends ComparisonFilter<T, E, string> {
  escape?: string
  ignoreCase: boolean

  constructor (extractor: ValueExtractor<T, E>, pattern: string, escape: string = '', ignoreCase: boolean = false) {
    super('LikeFilter', extractor, pattern)

    if (escape && escape.length > 0) {
      this.escape = escape
    }
    this.ignoreCase = ignoreCase || false
  }
}
