/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ValueManipulator } from '../processor/'
import { Util } from '../util/'
import { ChainedExtractor, IdentityExtractor, UniversalUpdater, ValueExtractor, ValueUpdater } from '.'
import { internal } from './package-internal'

export class CompositeUpdater<T, U>
  extends ValueUpdater<T, U>
  implements ValueManipulator {
  '@class': string

  extractor: ValueExtractor<T, U>

  updater: ValueUpdater<T, U>

  constructor (methodOrExtractor: string | ValueExtractor<T, U>, updater?: ValueUpdater<T, U>) {
    super(internal.extractorName(('CompositeUpdater')))
    if (updater) {
      // Two arg constructor
      this.extractor = methodOrExtractor as ValueExtractor<T, U>
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

  getExtractor (): ValueExtractor<T, U> {
    return this.extractor
  }

  getUpdater (): ValueUpdater<T, U> {
    return this.updater
  }
}
