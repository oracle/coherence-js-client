import { Filter } from './filter';
import { UniversalExtractor } from '../extractor/universal_extractor';
import { ValueExtractor } from '../extractor/value_extractor';
import { calculateString } from 'bytebuffer';
import { Util } from '../util/util';

export abstract class BaseFilter<T>
    implements Filter<T> {

    public '@class': string;

    constructor(clz: string) {
        this['@class'] = Util.fqFilterName(clz);
    }

    and(other: Filter<any>): Filter<any> {
        return new AndFilter(this, other);
    }

    or(other: Filter<any>): Filter<any> {
        return new OrFilter(this, other);
    }

}

export abstract class ExtractorFilter<T, E>
    extends BaseFilter<T> {

    extractor: ValueExtractor<T, E>;

    constructor(typeName: string, extractor: ValueExtractor<T, E>) {
        super(typeName);
        this.extractor = extractor;
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

    value: C | undefined;

    constructor(typeName: string, extractor: ValueExtractor<T, E>, value?: C) {
        super(typeName, extractor);
        this.value = value;
    }

}


export abstract class ArrayFilter
    implements Filter<any> {

    protected '@class': string;

    protected filters: Filter<any>[];

    constructor(clz: string, filters: Filter<any>[]) {
        this['@class'] = clz;
        this.filters = filters;
    }

    evaluate(obj: any): boolean {
        throw new Error("Method not implemented.");
    }

    and(other: Filter<any>): Filter<any> {
        return new AndFilter(this, other);
    }

    or(other: Filter<any>): Filter<any> {
        return new OrFilter(this, other);
    }

}

export class AnyFilter
    extends ArrayFilter {

    constructor(filters: Filter<any>[]) {
        super('filter.AnyFilter', filters);
    }

}

export class AllFilter
    extends ArrayFilter {

    constructor(filters: Filter<any>[]) {
        super('filter.AllFilter', filters);
    }

}

export class AndFilter
    extends AllFilter {

    constructor(first: Filter<any>, second: Filter<any>) {
        super([first, second]);
        this['@class'] = 'filter.AndFilter';
    }

}

export class OrFilter
    extends AnyFilter {

    constructor(first: Filter<any>, second: Filter<any>) {
        super([first, second]);
        this['@class'] = 'filter.OrFilter';
    }
}
