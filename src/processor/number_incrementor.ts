/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { PropertyProcessor } from './property_processor';
import { ValueManipulator } from './value_manipulator';
import { UniversalUpdater } from '../extractor/universal_updater';
import { ValueExtractor } from '../extractor/value_extractor';
import { UniversalExtractor } from '../extractor/universal_extractor';
import { PropertyManipulator } from './property_manipulator';
import { CompositeUpdater } from '../extractor/composite_updater';

/**
 * NumberIncrementor entry processor.
 *
 * @param <K> the type of the Map entry key
 * @param <V> the type of the Map entry value
 */
export class NumberIncrementor<K=any, V=any>
    extends PropertyProcessor<K, V, number> {

    /**
      The number to multiply by.
     */
    increment: number;

    /**
     * Whether to return the value before it was multiplied ("post-factor") or
     * after it is multiplied ("pre-factor").
     */
    postIncrement: boolean;

    /**
     * Construct a NumberIncrementor EntryProcessor.
     *
     * @param filter  The number to multiply by.
     * @param value   a value to update an entry with
     */
    constructor(manipulator: ValueManipulator<V, number>, increment: number, postIncrement?: boolean);
    constructor(propertyName: string, increment: number, postIncrement?: boolean);
    constructor(nameOrManipulator: ValueManipulator<V, number> | string, increment: number, postIncrement: boolean = false) {
        if (typeof nameOrManipulator === 'string') {
            // Need to create a ValueManipulator
            super('NumberIncrementor', NumberIncrementor.createCustomManipulator<V>(nameOrManipulator));
        } else {
            super('NumberIncrementor', nameOrManipulator);
        }
        this.increment = increment;
        this.postIncrement = postIncrement;
    }

    returnOldValue(): this {
        this.postIncrement = true;
        return this;
    }
    
    returnNewValue(): this {
        this.postIncrement = false;
        return this;
    }

    // Since we are using JSON format cannot use ReflectionExtractor and ReflectionUpdater
    // (which are used by PropertyManipulator). So we create a CompositeUpdater that
    // uses UniversalExtractor and UniversalUpdater respectively.
    private static createCustomManipulator<V>(name: string): ValueManipulator<V, number> {
        return new CompositeUpdater(new UniversalExtractor(name), new UniversalUpdater(name));
    }
}
