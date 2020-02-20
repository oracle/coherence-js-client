import { EntryAggregator, StreamingAggregator } from "./aggregator";
import { Util } from "../util/util";

/**
 * CompositeAggregator provides an ability to execute a collection of
 * aggregators against the same subset of the entries in an
 * Map, resulting in a list of corresponding aggregation
 * results. The size of the returned list will always be equal to the
 * length of the aggregators' array.
 */
export class CompositeAggregator<K, V, R>
    implements StreamingAggregator<K, V, any, any[]> {

    '@class': string;

    aggregators = new Array<EntryAggregator<K, V, R>>();

    constructor(aggregator1: EntryAggregator<K, V, R>, aggregator2: EntryAggregator<K, V, R>) {
        this['@class'] = Util.toAggregatorName('CompositeAggregator');
        this.aggregators.push(aggregator1);
        this.aggregators.push(aggregator2);
    }

    andThen(aggregator: EntryAggregator<K, V, R>): CompositeAggregator<K, V, R> {
        this.aggregators.push(aggregator);
        return this;
    }
}

