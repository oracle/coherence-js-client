import { AbstractAggregator } from "./aggregator";
import { ValueExtractor } from "../extractor/value_extractor";
import { AbstractDoubleAggregator } from "./abstract_double_aggregator";

/**
 * Calculates a maximum of numeric values extracted from a set of
 * entries in a Map in a form of a numerical value. All the extracted
 * objects will be treated as numerical values. If the set of entries is
 * empty, a null result is returned.

* @param <T>  the type of the value to extract from
 */
export class MaxAggregator<T>
    extends AbstractDoubleAggregator<T> {

    constructor(extractor: ValueExtractor<T, number>);
    constructor(property: string);
    constructor(extractorOrProperty: ValueExtractor<T, number> | string) {
        // ?? This doesn't work => super(clz, extractorOrProperty);
        if (extractorOrProperty instanceof ValueExtractor) {
            super('ComparableMax', extractorOrProperty);
        } else {
            super('ComparableMax', extractorOrProperty);
        }
    }

}