/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { ValueExtractor } from "../extractor/value_extractor";
import { SumAggregator } from './sum_aggregator';
import { MinAggregator } from "./min_aggregator";
import { MaxAggregator } from "./max_aggregator";
import { AverageAggregator } from "./average_aggregator";
import { StreamingAggregator, EntryAggregator } from "./aggregator";
import { CountAggregator } from "./count_aggregator";
import { DistinctValuesAggregator } from "./distinct_aggregator";
import { Filter } from "../filter/filter";
import { GroupAggregator } from "./group_aggregator";

export class Aggregators {

    static average<K, V, T>(extractorOrProperty: ValueExtractor<T, number> | string): StreamingAggregator<K, V, number, number> {
        if (extractorOrProperty instanceof ValueExtractor) {
            return new AverageAggregator(extractorOrProperty as ValueExtractor);
        }
        return new AverageAggregator(extractorOrProperty);;
    }

    static count<K, V>(): StreamingAggregator<K, V, any, number> {
        return new CountAggregator();
    }

    static distinct<K, V, T>(extractorOrProperty: ValueExtractor<T, number> | string): StreamingAggregator<K, V, number, number> {
        if (extractorOrProperty instanceof ValueExtractor) {
            return new DistinctValuesAggregator(extractorOrProperty as ValueExtractor);
        }
        return new DistinctValuesAggregator(extractorOrProperty);;
    }

    static groupBy<K, V, T, E, R>(extractorOrProperty: ValueExtractor<T, E> | string, aggregator: EntryAggregator<K, V, T>, filter: Filter): StreamingAggregator<K, V, Map<E, any>, Map<E, R>> {
        if (extractorOrProperty instanceof ValueExtractor) {
            return new GroupAggregator(extractorOrProperty as ValueExtractor, aggregator, filter);
        }
        return new GroupAggregator(extractorOrProperty, aggregator, filter);
    }

    static min<K, V, T>(extractorOrProperty: ValueExtractor<T, number> | string): StreamingAggregator<K, V, number, number> {
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