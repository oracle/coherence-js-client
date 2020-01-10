import { BaseProcessor } from "./base_processor";
import { ValueManipulator } from "./value_manipulator";
import { PropertyManipulator } from "./property_manipulator";

export abstract class PropertyProcessor<K, V, R>
    extends BaseProcessor<K, V, R> {

    /**
     * The property value manipulator.
     */
    manipulator: ValueManipulator<V, R>;
    /**
     * Construct a PropertyProcessor for the specified property name.
     * <p>
     * This constructor assumes that the corresponding property getter will
     * have a name of ("get" + sName) and the corresponding property setter's
     * name will be ("set + sName).
     *
     * @param sName  a property name
     */
    constructor(typeName: string, propertyName: string);
    constructor(typeName: string, propertyName: string, useIs: boolean);
    constructor(typeName: string, manipulator: ValueManipulator<V, R>);
    constructor(typeName: string, manipulatorOrPropertyName: ValueManipulator<V, R> | string, useIs: boolean = false) {
        super(typeName);
        if (typeof manipulatorOrPropertyName === 'string') {
            this.manipulator = new PropertyManipulator(manipulatorOrPropertyName, useIs);
        } else {
            this.manipulator = manipulatorOrPropertyName;
        }
    }
}


