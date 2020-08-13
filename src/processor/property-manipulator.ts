/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ValueExtractor, ValueUpdater } from '../extractor/'
import { ValueManipulator } from '.'
import { internal } from './package-internal'

/**
 * `PropertyManipulator` is a reflection based ValueManipulator implementation
 * based on the JavaBean property name conventions.
 *
 * @typeParam V  the type of value manipulate
 * @typeParam R  the return type of manipulation
 */
export class PropertyManipulator<V, R>
  implements ValueManipulator<V, R> {
  /**
   * Server-side {@link PropertyManipulator} implementation type identifier
   */
  protected '@class': string

  /**
   * The property name, never `null`.
   */
  protected name: string

  /**
   * The getter prefix flag.
   */
  useIsPrefix: boolean

  /**
   * Construct a PropertyManipulator for the specified property name.
   * <p>
   * This constructor assumes that the corresponding property getter will
   * have a name of either ("get" + sName) or ("is + sName) and the
   * corresponding property setter's name will be ("set + sName).
   *
   * @param propertyName  a property name
   * @param useIs         if true, the getter method will be prefixed with "is"
   *                      rather than "get"
   */
  constructor (propertyName: string, useIs: boolean = false) {
    this['@class'] = internal.processorName('PropertyManipulator')
    this.name = propertyName
    this.useIsPrefix = useIs
  }

  /**
   * @inheritDoc
   */
  getExtractor (): ValueExtractor<V, R> {
    throw new Error('Method not implemented.')
  }

  /**
   * @inheritDoc
   */
  getUpdater (): ValueUpdater<V, R> {
    throw new Error('Method not implemented.')
  }
}
