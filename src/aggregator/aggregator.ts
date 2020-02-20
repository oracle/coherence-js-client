import { Util } from "../util/util";
import { CompositeAggregator } from "./composite_aggregator";
import { MapEntry } from "../cache/query_map";
import { ValueExtractor } from "../extractor/value_extractor";
import { UniversalExtractor } from "../extractor/universal_extractor";

/**
 * An EntryAggregator represents processing that can be directed to occur
 * against some subset of the entries in an InvocableMap, resulting in a
 * aggregated result. Common examples of aggregation include functions such
 * as min(), max() and avg(). However, the concept of aggregation applies to
 * any process that needs to evaluate a group of entries to come up with a
 * single answer.
 *
 * @param <K> the type of the Map entry keys
 * @param <V> the type of the Map entry values
 * @param <R> the type of the value returned by the EntryAggregator
 */
export interface EntryAggregator<K, V, R> {

}

/**
 * A StreamingAggregator is an extension of {@link EntryAggregator} that
 * processes entries in a streaming fashion and provides better control
 * over {@link #characteristics() execution characteristics}.
 * <p>
 * It is strongly recommended that all new custom aggregator implementations
 * implement this interface directly and override default implementation of
 * the {@link #characteristics()} method which intentionally errs on a
 * conservative side.
 *
 * @param <K> the type of the Map entry keys
 * @param <V> the type of the Map entry values
 * @param <P> the type of the partial result
 * @param <R> the type of the final result
 *
 * @see EntryAggregator
 */
export interface StreamingAggregator<K, V, P, R>
    extends EntryAggregator<K, V, R> {

}

/**
 * Abstract base class implementation of {@link EntryAggregator}
 * that supports streaming aggregation.
 *
 * @param <K> the type of the Map entry key
 * @param <V> the type of the Map entry value
 * @param <T> the type of the value to extract from
 * @param <E> the type of the extracted value to aggregate
 * @param <R> the type of the aggregation result
 *
 * @since Coherence 3.1
 */
export abstract class AbstractAggregator<K = any, V = any, T = any, E = any, R = any>
    implements StreamingAggregator<K, V, any, R> {

    '@class': string;

    // parallel = false;

    extractor: ValueExtractor<T, E>;

    constructor(clz: string, extractor: ValueExtractor<T, E>);
    constructor(clz: string, property: string);
    constructor(clz: string, extractorOrProperty: ValueExtractor<T, E> | string) {
        this['@class'] = Util.toAggregatorName(clz);
        if (extractorOrProperty instanceof ValueExtractor) {
            this.extractor = extractorOrProperty;
        } else {
            this.extractor = new UniversalExtractor(extractorOrProperty);
        }
    }

    aggregate(entries: Set<MapEntry<K, V>>): R {
        throw new Error('aggregate not implemented');
    }

    andThen(aggregator: EntryAggregator<K, V, R>): CompositeAggregator<K, V, R> {
        return new CompositeAggregator(this, aggregator);
    }
}