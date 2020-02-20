import { AbstractAggregator } from "./aggregator";
import { ValueExtractor } from "../extractor/value_extractor";
import { AbstractDoubleAggregator } from "./abstract_double_aggregator";

/**
* Sums up numeric values extracted from a set of entries in a Map. All the
* extracted Number objects will be treated as Java <tt>double</tt> values.
*
* @param <T>  the type of the value to extract from
 */
export class SumAggregator<T>
    extends AbstractDoubleAggregator<T> {

    constructor(extractor: ValueExtractor<T, number>);
    constructor(property: string);
    constructor(extractorOrProperty: ValueExtractor<T, number> | string) {
        // ?? This doesn't work => super(clz, extractorOrProperty);
        if (extractorOrProperty instanceof ValueExtractor) {
            super('BigDecimalSum', extractorOrProperty);
        } else {
            super('BigDecimalSum', extractorOrProperty);
        }
    }

}