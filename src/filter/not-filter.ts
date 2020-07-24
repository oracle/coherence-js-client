/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { Filter } from './filter'

export class NotFilter<T = any>
  extends Filter<T> {
  filter: Filter<T>

  constructor (filter: Filter<T>) {
    super('NotFilter')
    this.filter = filter
  }
}
