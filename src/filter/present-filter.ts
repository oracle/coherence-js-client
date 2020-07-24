/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { Filter } from './filter'

/**
 * Filter which returns true for {@link com.tangosol.util.InvocableMap.Entry}
 * objects that currently exist in a Map.
 * <p>
 * This Filter is intended to be used solely in combination with a
 * {@link com.tangosol.util.processor.ConditionalProcessor} and is unnecessary
 * for standard {@link com.tangosol.util.QueryMap} operations.
 *
 * @param <T> the type of the input argument to the filter
 *
 * @see com.tangosol.util.InvocableMap.Entry#isPresent()
 */
export class PresentFilter<T = any>
  extends Filter<T> {
  public static INSTANCE = new PresentFilter()

  constructor () {
    super('PresentFilter')
  }
}
