/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

/**
 * ValueUpdater is used to update an object's state.
 *
 * @param <T>  the type of object
 * @param <U>  the type of value used to update the object
 */
export interface ValueUpdater<T=any, U=any> {
    /**
     * Update the state of the passed target object using the passed value.
     * For intrinsic types, the specified value is expected to be a standard
     * wrapper type in the same manner that reflection works; for example, an
     * <tt>int</tt> value would be passed as a <tt>java.lang.Integer</tt>.
     *
     * @param target  the Object to update the state of
     * @param value   the new value to update the state with
     *
     */
    update(target: T, value: U): void;
}