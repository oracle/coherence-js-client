import { BaseProcessor } from './base_processor';
import { Filter } from '../filter/filter';
import { PropertyProcessor } from './property_processor';

/**
 * NumberMultiplier entry processor.
 *
 * @param <K> the type of the Map entry key
 * @param <V> the type of the Map entry value
 */
export class NumberMultiplier<K, V, N extends number>
    extends PropertyProcessor<K, V, void> {

    /**
      The number to multiply by.
     */
    multiplier: N;

    /**
     * Whether to return the value before it was multiplied ("post-factor") or
     * after it is multiplied ("pre-factor").
     */
    postMultiplication: boolean;

    /**
     * Construct a NumberMultiplier EntryProcessor.
     *
     * @param filter  The number to multiply by.
     * @param value   a value to update an entry with
     */
    constructor(propertyName: string, multiplier: N, postMultiplication: boolean = false) {
        super('NumberMultiplier', propertyName);

        this.multiplier = multiplier;
        this.postMultiplication = postMultiplication;
    }

}
