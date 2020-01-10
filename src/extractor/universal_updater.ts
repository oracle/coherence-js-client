
import { AbstractValueUpdater } from '../util/abstract_value_updater';
import { Util } from '../util/util';

/**
  * Universal ValueUpdater implementation.
  * <p>
  * Either a property-based and method-based {@link com.tangosol.util.ValueUpdater}
  * based on whether constructor parameter <code>sName</code> is evaluated to be a property or method.
  * Depending on the <code>target</code> parameter of {@link #update(Object, Object)} <code>target</code>,
  * the property can reference a JavaBean property or {@link Map} key.
  * 
  */
export class UniversalUpdater<T, E>
    extends AbstractValueUpdater<T, E> {

    name: string;

    /**
     * Construct a UniversalUpdater for the provided name.
     * If <code>method</code> ends in a '()',
     * then the name is a method name. This implementation assumes that a
     * target's class will have one and only one method with the
     * specified name and this method will have exactly one parameter;
     * if the method is a property name, there should be a corresponding
     * JavaBean property modifier method or it will be used as a 
     * key in a {@link Map}.
     *
     * @param method a method or property name
     */
    constructor(method: string) {
        super(Util.EXTRACTOR_PACKAGE + 'UniversalUpdater');
        this.name = method;
    }

}