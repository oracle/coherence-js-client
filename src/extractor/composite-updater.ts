/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ValueManipulator } from '../processor/'
import { ChainedExtractor, IdentityExtractor, UniversalUpdater, ValueExtractor, ValueUpdater } from '.'
import { Util } from '../util/util' // not exported by default
import { internal } from './package-internal'

/**
 * A ValueUpdater implementation based on an extractor-updater pair that could
 * also be used as a ValueManipulator.
 */
export class CompositeUpdater
  extends ValueUpdater<any, any>
  implements ValueManipulator<any, any> {

  /**
   * The ValueExtractor part.
   */
  protected readonly extractor: ValueExtractor<any, any>

  /**
   * The ValueUpdater part.
   */
  protected readonly updater: ValueUpdater<any, any>

  /**
   * Constructs a new `CompositeUpdater`.
   *
   * @param methodOrExtractor  the {@link ValueExtractor} or the name of the method to invoke via reflection
   * @param updater            the {@link ValueUpdater}
   */
  constructor (methodOrExtractor: string | ValueExtractor<any, any>, updater?: ValueUpdater<any, any>) {
    super(internal.extractorName(('CompositeUpdater')))
    if (updater) {
      // Two arg constructor
      this.extractor = methodOrExtractor as ValueExtractor<any, any>
      this.updater = updater
    } else {
      // One arg with method name
      const methodName = methodOrExtractor as string
      Util.ensureNonEmptyString(methodName, 'method name has to be non empty')

      const last = methodName.lastIndexOf('.')
      this.extractor = last == -1
        ? IdentityExtractor.INSTANCE
        : new ChainedExtractor(methodName.substring(0, last))
      this.updater = new UniversalUpdater(methodName.substring(last + 1))
    }
  }

  /**
   * @inheritDoc
   */
  getExtractor (): ValueExtractor<any, any> {
    return this.extractor
  }

  /**
   * @inheritDoc
   */
  getUpdater (): ValueUpdater<any, any> {
    return this.updater
  }
}
