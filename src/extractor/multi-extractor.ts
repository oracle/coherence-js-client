/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { AbstractCompositeExtractor, ChainedExtractor, ReflectionExtractor, ValueExtractor } from '.'
import { internal } from './package-internal'

export class MultiExtractor
  extends AbstractCompositeExtractor {
  constructor (extractorsOrMethod: ValueExtractor<any, any>[] | string) {
    super(internal.extractorName('MultiExtractor'),
      ((typeof extractorsOrMethod === 'string')
        ? MultiExtractor.createExtractors(extractorsOrMethod)
        : extractorsOrMethod))
  }

  protected static createExtractors (fields: string): ValueExtractor<any, any>[] {
    const names = fields.split(',').filter(f => f != null && f.length > 0)
    const arr = new Array<ValueExtractor<any, any>>()
    for (const name of names) {
      arr.concat(name.indexOf('.') < 0 ? new ReflectionExtractor(name) : new ChainedExtractor(name))
    }

    return arr
  }
}
