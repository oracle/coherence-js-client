import { ValueExtractor } from "../extractor/value_extractor";
import { SumAggregator } from './sum_aggregator';
import { MinAggregator } from "./min_aggregator";
import { MaxAggregator } from "./max_aggregator";
import { AverageAggregator } from "./average_aggregator";

export class Aggregators {

    static avg<T>(extractorOrProperty: ValueExtractor<T, number> | string): AverageAggregator<T> {
        if (extractorOrProperty instanceof ValueExtractor) {
            return new AverageAggregator(extractorOrProperty as ValueExtractor);
        }
        return new AverageAggregator(extractorOrProperty);;
    }

    static min<T>(extractorOrProperty: ValueExtractor<T, number> | string): MinAggregator<T> {
        if (extractorOrProperty instanceof ValueExtractor) {
            return new MinAggregator(extractorOrProperty as ValueExtractor);
        }
        return new MinAggregator(extractorOrProperty);;
    }

    static max<T>(extractorOrProperty: ValueExtractor<T, number> | string): MaxAggregator<T> {
        if (extractorOrProperty instanceof ValueExtractor) {
            return new MaxAggregator(extractorOrProperty as ValueExtractor);
        }
        return new MaxAggregator(extractorOrProperty);;
    }

    static sum<T>(extractorOrProperty: ValueExtractor<T, number> | string): SumAggregator<T> {
        if (extractorOrProperty instanceof ValueExtractor) {
            return new SumAggregator(extractorOrProperty as ValueExtractor);
        }
        return new SumAggregator(extractorOrProperty);;
    }

}