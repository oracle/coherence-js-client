/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ChainedExtractor, IdentityExtractor, UniversalExtractor , ValueExtractor} from '../extractor/'
import { internal } from './package-internal'
import { EntryProcessor } from '.'

/**
 * `ExtractorProcessor` is an {@link EntryProcessor} implementation that extracts a
 * value from an object cached a NamedMap. A common usage pattern is:
 * ```javascript
 *   cache.invoke(oKey, new ExtractorProcessor(extractor));
 * ```
 * For clustered caches using the ExtractorProcessor could significantly reduce the amount of network
 * traffic.
 *
 * @typeParam K  the type of the Map entry keys
 * @typeParam V  the type of the Map entry values
 * @typeParam T  the type of the value to extract from
 * @typeParam E  the type of the extracted value
 */
export class ExtractorProcessor<K = any, V = any, T = any, E = any>
  extends EntryProcessor<K, V, T> {

  /**
   * The underlying value extractor.
   */
  extractor: ValueExtractor<T, E | any> // This is because ChainedExtractor doesnt guarantee <T, E>

  /**
   * Construct an ExtractorProcessor using the given extractor or method name.
   *
   * @param extractorOrMethod  the ValueExtractor to use by this filter or the name of the method to
   *                           invoke via reflection
   */
  constructor (extractorOrMethod: ValueExtractor<T, E> | string | undefined) {
    super(internal.processorName('ExtractorProcessor'))
    if (extractorOrMethod instanceof ValueExtractor) {
      this.extractor = extractorOrMethod
    } else {
      if (!extractorOrMethod) {
        this.extractor = IdentityExtractor.INSTANCE
      } else {
        this.extractor = (extractorOrMethod.indexOf('.') < 0)
          ? new UniversalExtractor(extractorOrMethod)
          : new ChainedExtractor(extractorOrMethod)
      }
    }
  }
}
