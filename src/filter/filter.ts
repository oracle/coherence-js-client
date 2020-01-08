import { ChainedExtractor, ReflectionExtractor, ValueExtractor } from '../extractor/value_extractor';
import { Util } from '../util/util';

export abstract class Filter<T = any> {

    '@class': string;

    constructor(clz: string) {
        this['@class'] = Util.toFilterName(clz);
    }

    and(other: Filter): Filter {
        return new AndFilter(this, other);
    }

    or(other: Filter): Filter {
        return new OrFilter(this, other);
    }

    xor(other: Filter): Filter {
        return new XorFilter(this, other);
    }

    associatedWith(key: object): KeyAssociatedFilter<T> {
        return new KeyAssociatedFilter(this, key);
    }

    forKeys<K>(keys: Set<K>) {
        return new InKeySetFilter(this, keys);
    }

    evaluate(o: T) {
        throw new Error('evaluate not implemented');
    }
}

export abstract class ExtractorFilter<T, E>
    extends Filter<T> {

    extractor: ValueExtractor<T, E | any>;      // This is because ChainedExtractor cannot guarantee <T, E>

    constructor(typeName: string, extractor: ValueExtractor<T, E>);
    constructor(typeName: string, method: string);
    constructor(typeName: string, extractorOrMethod: ValueExtractor<T, E> | string) {
        super(typeName);
        this.extractor = (extractorOrMethod instanceof ValueExtractor)
            ? extractorOrMethod 
            : (extractorOrMethod.indexOf('.') < 0)
                ? new ReflectionExtractor(extractorOrMethod)
                : new ChainedExtractor(extractorOrMethod);
    }
}

/**
 * Filter which compares the result of a method invocation with a value.
 *
 * @param <T> the type of the input argument to the filter
 * @param <E> the type of the extracted attribute to use for comparison
 * @param <C> the type of value to compare extracted attribute with
 */
export class ComparisonFilter<T, E, C>
    extends ExtractorFilter<T, E> {

    value: C;

    constructor(typeName: string, extractor: ValueExtractor<T, E>, value: C);
    constructor(typeName: string, method: string, value: C);
    constructor(typeName: string, extractorOrMethod: ValueExtractor<T, E> | string, value: C) {
        if (extractorOrMethod instanceof ValueExtractor) {
            super(typeName, extractorOrMethod);
        } else {
            super(typeName, extractorOrMethod);
        }
        this.value = value;
    }

}

export abstract class ArrayFilter
    extends Filter {

    protected filters: Filter[];

    constructor(clz: string, filters: Filter[]) {
        super(clz);
        this.filters = filters;
    }

}

export class AnyFilter
    extends ArrayFilter {

    constructor(filters: Filter[]) {
        super('AnyFilter', filters);
    }

}

export class AllFilter
    extends ArrayFilter {

    constructor(filters: Filter[]) {
        super('AllFilter', filters);
    }

}

export class AndFilter
    extends AllFilter {

    constructor(first: Filter, second: Filter) {
        super([first, second]);
        this['@class'] = Util.toFilterName('AndFilter');
    }

}

export class OrFilter
    extends AnyFilter {

    constructor(first: Filter, second: Filter) {
        super([first, second]);
        this['@class'] = Util.toFilterName('OrFilter');
    }
}


export class XorFilter
    extends ArrayFilter {

    constructor(first: Filter, second: Filter) {
        super('XorFilter', [first, second]);
    }
}
/**
 * Filter which limits the scope of another filter according to the key
 * association information.
 *
 * @remarks
 * *Note 1:* This filter must be the outermost filter and cannot be used
 * as a part of any composite filter (AndFilter, OrFilter, etc.)
 * *Note 2:* This filter is intended to be processed only on the client
 * side of the partitioned cache service.
 * 
 * Example:
 * ```ts
 * var filter = Filter.less('age', 40).associatedWith(10);
 * map.values(filter).then(values => {
 *   for (const entry of values) {
 *     console.log(JSON.stringify(entry, null, 4));
 *   }
 * });
 * ```
 */

 export class KeyAssociatedFilter<T>
    extends Filter<T>  {

    filter: Filter<T>;

    hostKey: any;

    /**
     * Filter which limits the scope of another filter according to the key
     * association information.
     * 
     * @param {Filter} filter the other filter whose scope to limit
     *
     * @param {Object} hostKey the `filter` argument will only be applied to
     * cache service nodes that contain this key.
     */
    constructor(filter: Filter, hostKey: any) {
        super('KeyAssociatedFilter');
        this.filter = filter;
        this.hostKey = hostKey;
    }

}

export class InKeySetFilter<T, K>
    extends Filter<T> {

    filter: Filter<T>;

    keys: Set<K>;

    constructor(filter: Filter<T>, keys: Set<K>) {
        super('InKeySetFilter');
        this.filter = filter;
        this.keys = keys;
    }
}
