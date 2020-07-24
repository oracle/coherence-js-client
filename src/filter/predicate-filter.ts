/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ValueExtractor } from '../extractor/'
import { ExtractorFilter } from '.'
import { internal } from './package-internal'

/**
 * A {@code java.util.function.Predicate} based {@link ExtractorFilter}.
 */
export class PredicateFilter<T = any, E = any>
  extends ExtractorFilter<T, E> {
  /**
   * The 'Predicate' for filtering extracted values.
   */
  predicate: { '@class': string }

  /**
   * Constructs a {@link PredicateFilter}.
   *
   * @param predicate  predicate for testing the value. The object must
   *                   have an '@class' attribute.
   */
  constructor (predicate: { '@class': string }, extractor?: ValueExtractor<T, E> | undefined) {
    super(internal.filterName('PredicateFilter'), extractor || ValueExtractor.identityCast())
    this.predicate = predicate
  }
}
