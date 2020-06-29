/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { UniversalExtractor } from '../extractor/universal_extractor'
import { ChainedExtractor, IdentityExtractor, ValueExtractor } from '../extractor/value_extractor'
import { BaseProcessor } from './base_processor'

/**
 * An invocable agent that operates against the entry objects within a
 * {@link module:coherence-js/cache/NamedCache}.  Several of the methods
 * on `NamedCache` that accept a processor can also accept filter to
 * constrain the set of entries to which the processor will be applied.
 *
 * @param <K> the type of the NamedCache entry key.
 * @param <V> the type of the NamedCache entry value.
 * @param <R> the type of value returned by the EntryProcessor.
 *
 */
export class ExtractorProcessor<K = any, V = any, T = any, E = any>
  extends BaseProcessor<K, V, T> {
  name?: string

  extractor: ValueExtractor<T, E | any> // This is because ChainedExtractor doesnt guarantee <T, E>

  constructor (methodName?: string) {
    super('ExtractorProcessor')
    // this.name = methodName;
    if (!methodName) {
      this.extractor = IdentityExtractor.INSTANCE
    } else {
      this.extractor = (methodName.indexOf('.') < 0)
        ? new UniversalExtractor(methodName) // ?? fails ==> new ReflectionExtractor(methodName)
        : new ChainedExtractor(methodName)
    }
  }
}
