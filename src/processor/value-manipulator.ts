/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ValueExtractor } from '@extractor/value-extractor'
import { ValueUpdater } from '../util/value_updater'

/**
 * ValueManipulator represents a composition of {@link ValueExtractor} and
 * {@link ValueUpdater} implementations.
 *
 * @param <T>  the type of object
 * @param <V>  the type of value that will be extracted/updated from/on object
 */
export interface ValueManipulator<T = any, V = any> {
  /**
   * Retrieve the underlying ValueExtractor reference.
   *
   * @return the ValueExtractor
   */
  getExtractor (): ValueExtractor<T, V>;

  /**
   * Retrieve the underlying ValueUpdater reference.
   *
   * @return the ValueUpdater
   */
  getUpdater (): ValueUpdater<T, V>;
}
