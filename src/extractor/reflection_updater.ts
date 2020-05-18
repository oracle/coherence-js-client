/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { AbstractValueUpdater } from '../util/abstract_value_updater';
import { Util } from '../util/util';

/**
 * Universal ValueUpdater implementation.
 * <p>
 * Either a property-based and method-based {@link com.tangosol.util.ValueUpdater}
 * based on whether constructor parameter <code>smethod</code> is evaluated to be a property or method.
 * Depending on the <code>target</code> parameter of {@link #update(Object, Object)} <code>target</code>,
 * the property can reference a JavaBean property or {@link Map} key.
 * 
 */
export class ReflectionUpdater<T=any, E=any>
    extends AbstractValueUpdater<T, E> {

    method: string;

    /**
     * Construct a UniversalUpdater for the provided method.
     * If <code>smethod</code> ends in a '()',
     * then the method is a method method. This implementation assumes that a
     * target's class will have one and only one method with the
     * specified method and this method will have exactly one parameter;
     * if the method is a property method, there should be a corresponding
     * JavaBean property modifier method or it will be used as a 
     * key in a {@link Map}.
     *
     * @param method a method or property method
     */
    constructor(method: string) {
        super(Util.EXTRACTOR_PACKAGE + 'ReflectionUpdater');
        this.method = method;
    }

}