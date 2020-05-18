/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { AbstractAggregator, StreamingAggregator, EntryAggregator } from "./aggregator";
import { ValueExtractor } from "../extractor/value_extractor";
import { AbstractDoubleAggregator } from "./abstract_double_aggregator";
import { Filter } from "../filter/filter";

/**
 * The GroupAggregator provides an ability to split a subset of entries
 * in a Map into a collection of non-intersecting subsets and then
 * aggregate them separately and independently. The splitting (grouping)
 * is performed using the results of the underlying {@link
 * UniversalExtractor} in such a way that two entries will belong to the
 * same group if and only if the result of the corresponding extract
 * call produces the same value or tuple (list of values). After the
 * entries are split into the groups, the underlying aggregator is
 * applied separately to each group. The result of the aggregation by
 * the GroupAggregator is a Map that has distinct values (or tuples) as
 * keys and results of the individual aggregation as
 * values. Additionally, those results could be further reduced using an
 * optional Filter object.
 *
 * Informally speaking, this aggregator is analogous to the SQL "group
 * by" and "having" clauses. Note that the "having" Filter is applied
 * independently on each server against the partial aggregation results;
 * this generally implies that data affinity is required to ensure that
 * all required data used to generate a given result exists within a
 * single cache partition. In other words, the "group by" predicate
 * should not span multiple partitions if the "having" clause is used.
 *
 * The GroupAggregator is somewhat similar to the {@link DistinctValues}
 * aggregator, which returns back a list of distinct values (tuples)
 * without performing any additional aggregation work.
 *
 * @param <T>  the type of the value to extract from
 */
export class GroupAggregator<K, V, T, E, R>
    extends AbstractAggregator<K, V, Map<E, any>, Map<E, R>> {

    aggregator: EntryAggregator<K, V, R>;

    filter: Filter;

    constructor(extractor: ValueExtractor<T, E>, aggregator: EntryAggregator<K, V, R>, filter: Filter);
    constructor(property: string, aggregator: EntryAggregator<K, V, R>, filter: Filter);
    constructor(extractorOrProperty: ValueExtractor<T, E> | string, aggregator: EntryAggregator<K, V, R>, filter: Filter) {
        // ?? This doesn't work => super(clz, extractorOrProperty);
        if (extractorOrProperty instanceof ValueExtractor) {
            super('GroupAggregator', extractorOrProperty as ValueExtractor);
        } else {
            super('GroupAggregator', extractorOrProperty);
        }

        this.aggregator = aggregator;
        this.filter = filter;
    }

}