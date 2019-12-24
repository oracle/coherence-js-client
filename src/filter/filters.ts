import { Filter } from './filter';

import { AllFilter, AnyFilter } from './base_filter';
import { AlwaysFilter } from './always_filter';
import { NeverFilter } from './never_filter';
import { ContainsAllFilter } from './contains_all_filter';
import { ValueExtractor } from '../extractor/value_extractor';
import { ContainsAnyFilter } from './contains_any_filter';
import { ContainsFilter } from './contains_filter';
import { IsNotNullFilter } from './is_not_null_filter';
import { IsNullFilter } from './is_null_filter';
import { EqualsFilter } from './equals_filter';
import { UniversalExtractor } from '../extractor/universal_extractor';
import { NotEqualsFilter } from './not_equals_filter';
import { GreaterFilter } from './greater_filter';
import { GreaterEqualsFilter } from './greater_equals_filter';

export class Filters {

    static all(fltrs: Filter<any>[]): AllFilter {
        return new AllFilter(fltrs);
    }

    static always(): AlwaysFilter {
        return new AlwaysFilter();
    }

    static any(filters: Filter<any>[]): AllFilter {
        return new AnyFilter(filters);
    }

    static never(): NeverFilter {
        return new NeverFilter();
    }

    static containsAll<T, E>(extractor: ValueExtractor<T, E>, values: any[]): ContainsAllFilter<T, E> {
        return new ContainsAllFilter(extractor, values);
    }

    static containsAny<T, E>(extractor: ValueExtractor<T, E>, values: any[]): ContainsAnyFilter<T, E> {
        return new ContainsAnyFilter(extractor, values);
    }

    static contains<T, E>(extractor: ValueExtractor<T, E>, value: E): ContainsFilter<T, E> {
        return new ContainsFilter(extractor, value);
    }


    static equals<T, E>(property: string, value: E): EqualsFilter<T, E>;
    static equals<T, E>(extractor: ValueExtractor<T, E>, value: E): EqualsFilter<T, E>;
    static equals<T, E>(arg: any, value: E): EqualsFilter<T, E> {
        if ((typeof arg) === 'string') {
            return new EqualsFilter(new UniversalExtractor(arg), value);
        }
        return new EqualsFilter(arg, value);
    }

    static isNotNull<T, E>(extractor: ValueExtractor<T, E>): IsNotNullFilter<T, E> {
        return new IsNotNullFilter(extractor);
    }

    static isNull<T, E>(extractor: ValueExtractor<T, E>): IsNotNullFilter<T, E> {
        return new IsNullFilter(extractor);
    }

    static notEquals<T, E>(property: string, value: E): NotEqualsFilter<T, E>;
    static notEquals<T, E>(extractor: ValueExtractor<T, E>, value: E): NotEqualsFilter<T, E>;
    static notEquals<T, E>(arg: any, value: E): NotEqualsFilter<T, E> {
        if ((typeof arg) === 'string') {
            return new NotEqualsFilter(new UniversalExtractor(arg), value);
        }
        return new NotEqualsFilter(arg, value);
    }
    
    static greater<T, E>(property: string, value: E): GreaterFilter<T, E>;
    static greater<T, E>(extractor: ValueExtractor<T, E>, value: E): GreaterFilter<T, E>;
    static greater<T, E>(arg: any, value: E): GreaterFilter<T, E> {
        if ((typeof arg) === 'string') {
            return new GreaterFilter(new UniversalExtractor(arg), value);
        }
        return new GreaterFilter(arg, value);
    }
        
    static greaterEquals<T, E>(property: string, value: E): GreaterEqualsFilter<T, E>;
    static greaterEquals<T, E>(extractor: ValueExtractor<T, E>, value: E): GreaterEqualsFilter<T, E>;
    static greaterEquals<T, E>(arg: any, value: E): GreaterEqualsFilter<T, E> {
        if ((typeof arg) === 'string') {
            return new GreaterEqualsFilter(new UniversalExtractor(arg), value);
        }
        return new GreaterEqualsFilter(arg, value);
    }
}
