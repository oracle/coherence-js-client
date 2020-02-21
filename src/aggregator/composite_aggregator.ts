import { EntryAggregator, StreamingAggregator } from "./aggregator";
import { Util } from "../util/util";

/**
 * CompositeAggregator provides an ability to execute a collection of
 * aggregators against the same subset of the entries in an
 * Map, resulting in a list of corresponding aggregation
 * results. The size of the returned list will always be equal to the
 * length of the aggregators' array.
 */
export class CompositeAggregator<K, V>
    implements StreamingAggregator<K, V, any, Array<any>> {

    '@class': string;

    aggregators: EntryAggregator<K, V, any>[] = [];

    constructor(aggregator1: EntryAggregator<K, V, any>, aggregator2: EntryAggregator<K, V, any>) {
        this['@class'] = Util.toAggregatorName('CompositeAggregator');
        this.aggregators.push(aggregator1);
        this.aggregators.push(aggregator2);
    }

    andThen<R>(aggregator: EntryAggregator<K, V, R>): CompositeAggregator<K, V> {
        this.aggregators.push(aggregator);
        return this;
    }
}

