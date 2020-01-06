import { Filter } from './filter';

import { AllFilter, AnyFilter } from './filter';
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
import { BetweenFilter } from './between_filter';
import { InFilter } from './in_filter';
import { LessFilter } from './less_filter';
import { LessEqualsFilter } from './less_equals_filter';
import { LikeFilter } from './like_filter';
import { NotFilter } from './not_filter';
import { PredicateFilter } from './predicate_filter';
import { PresentFilter } from './present_filter';
import { RegexFilter } from './regex_filter';

/**
 * Simple Filter DSL.
 * 
 * @remarks
 * The methods in this class are for the most part simple factory methods for
 * various {@link Filter} classes, but in some cases provide additional type
 * safety. They also tend to make the code more readable, especially if imported
 * statically, so their use is strongly encouraged in lieu of direct construction
 * of {@link Filter} classes.
 */
export class Filters {

    private static NEVER_INSTANCE = new NeverFilter();


    /**
     * Return a composite filter representing logical AND of all specified
     * filters.
     *
     * @param filters  a variable number of filters
     *
     * @return  a composite filter representing logical AND of all specified
     *          filters
     *
     * @see AllFilter
     */
    static all<T, K extends T>(...filters: Filter<K>[]): Filter {
        return new AllFilter(filters);
    }

    /**
     * Return a filter that always evaluates to true.
     *
     * @return a filter that always evaluates to true.
     *
     * @link AlwaysFilter
     */
    static always<T>(): Filter<T> {
        return new AlwaysFilter();
    }

    /**
     * Return a composite filter representing logical OR of all specified
     * filters.
     *
     * @param filters  an array of filters.
     *
     * @return  a composite filter representing logical OR of all specified
     *          filters
     *
     * @see AnyFilter
     */
    static any<T, K extends T>(...filters: Filter<K>[]): Filter {
        return new AnyFilter(filters);
    }

    /**
     * Return a filter that tests if the extracted array contains the
     * specified value.
     *
     * @param extractor  the ValueExtractor to use.
     * @param value      the value to compare the extracted value with.
     * @param <T>        the type of the object to extract value from.
     * @param <E>        the type of extracted value.
     *
     * @return  a filter that tests if the extracted array contains the
     *          specified value.
     *
     * @see ContainsFilter
     */    
    static arrayContains<T, E>(extractor: ValueExtractor<T, E[]>, value: E): Filter<T> {
        return new ContainsFilter(extractor, value);
    }

    /**
     * Return a filter that tests if the extracted array contains all of
     * the specified values.
     *
     * @param extractor  the ValueExtractor to use.
     * @param setValues  the values to compare the extracted value with.
     * @param <T>        the type of the object to extract value from.value
     * @param <E>        the type of extracted value.
     *
     * @return  a filter that tests if the extracted array contains all of
     *          the specified values.
     *
     * @see ContainsAllFilter
     */
    static arrayContainsAll<T, E>(extractor: ValueExtractor<T, E[]>, ...value: E[]): Filter<T>;
    static arrayContainsAll<T, E, K extends E>(extractor: ValueExtractor<T, E>, values: Set<K>): Filter<T>;
    static arrayContainsAll<T, E, K>(extractor: ValueExtractor<T, E>, value: E[] | Set<K>): Filter<T> {
        return new ContainsAllFilter(extractor, value);
    }

        /**
     * Return a filter that tests if the extracted array contains any of
     * the specified values.
     *
     * @param extractor  the ValueExtractor to use.
     * @param setValues  the values to compare the extracted value with.
     * @param <T>        the type of the object to extract value from.value
     * @param <E>        the type of extracted value.
     *
     * @return  a filter that tests if the extracted array contains any of
     *          the specified values.
     *
     * @see ContainsAllFilter
     */
    static arrayContainsAny<T, E>(extractor: ValueExtractor<T, E>, ...value: E[]): Filter<T>;
    static arrayContainsAny<T, E, K extends E>(extractor: ValueExtractor<T, E>, values: Set<K>): Filter<T>;
    static arrayContainsAny<T, E, K>(extractor: ValueExtractor<T, E>, value: E[] | Set<K>): Filter<T> {
        return new ContainsAnyFilter(extractor, value);
    }

    /**
     * Return a filter that tests if the extracted value is between
     * the specified values (inclusive).
     *
     * @param extractor  the ValueExtractor to use.
     * @param from       the lower bound to compare the extracted value with.
     * @param to         the upper bound to compare the extracted value with.
     * @param <T>        the type of the object to extract value from.
     * @param <E>        the type of extracted value.
     *
     * @return  a filter that tests if the extracted value is between the
     *          specified values.
     *
     * @see BetweenFilter
     */
    static between<T, E>(extractor: ValueExtractor<T, E>, from: E, to: E): Filter<T> {
        return new BetweenFilter<T, E>(extractor, from, to);
        }

    /**
     * Return a filter that tests if the extracted collection contains the
     * specified value.
     *
     * @param extractor  the ValueExtractor to use
     * @param value      the value to compare the extracted value with
     * @param <T>        the type of the object to extract value from
     * @param <E>        the type of extracted value
     * @param <C>        the type of value that will be extracted by the extractor
     *
     * @return  a filter that tests if the extracted collection contains the
     *          specified value
     *
     * @see ContainsFilter
     */
    static contains<T, E>(extractor: ValueExtractor<T, E>, value: E): ContainsFilter<T, E> {
        return new ContainsFilter(extractor, value);
    }

    /**
     * Return a filter that tests if the extracted array contains all of
     * the specified values.
     *
     * @param extractor  the ValueExtractor to use.
     * @param values     the values to compare the extracted value with.
     * @param <T>        the type of the object to extract value from.
     * @param <E>        the type of extracted value.
     *
     * @return  a filter that tests if the extracted array contains all of
     *          the specified values.
     *
     * @see ContainsAllFilter
     */
    static containsAll<T, E>(extractor: ValueExtractor<T, E>, ...values: any[]): Filter<T>;
    static containsAll<T, E>(extractor: ValueExtractor<T, E>, values: Set<any>): Filter<T>;
    static containsAll<T, E>(extractor: ValueExtractor<T, E>, values: any[] | Set<any>): Filter<T> {
        return new ContainsAllFilter(extractor, values);
    }

    /**
     * Return a filter that tests if the extracted array contains any of
     * the specified values.
     *
     * @param extractor  the ValueExtractor to use.
     * @param values     the values to compare the extracted value with.
     * @param <T>        the type of the object to extract value from.
     * @param <E>        the type of extracted value.
     *
     * @return  a filter that tests if the extracted array contains all of
     *          the specified values.
     *
     * @see ContainsAllFilter
     */
    static containsAny<T, E>(extractor: ValueExtractor<T, E>, ...values: any[]): Filter<T>;
    static containsAny<T, E>(extractor: ValueExtractor<T, E>, values: Set<any>): Filter<T>;
    static containsAny<T, E>(extractor: ValueExtractor<T, E>, values: any[] | Set<any>): Filter<T> {
        return new ContainsAnyFilter(extractor, values);
    }

    /**
     * Return a filter that tests for equality using a {@link filter.UniversalExtractor}
     * instance to extract the specified field.
     *
     * @param fieldName  the name of the field to use.
     * @param value      the value to compare the extracted value with.
     * @param <T>        the type of the object to extract value from.
     * @param <E>        the type of extracted value.
     *
     * @return a filter that tests for equality.
     *
     * @see EqualsFilter
     * @see com.tangosol.util.extractor.UniversalExtractor
     */
    static equal<T, E>(fieldName: string, value: E): EqualsFilter<T, E>;
    
    /**
     * Return a filter that tests for equality.
     *
     * @param extractor  the Extractor to use
     * @param value      the value to compare the extracted value with
     * @param <T>        the type of the object to extract value from
     * @param <E>        the type of extracted value
     *
     * @return a filter that tests for equality
     *
     * @see EqualsFilter
     */
    static equal<T, E>(extractor: ValueExtractor<T, E>, value: E): EqualsFilter<T, E>;
    static equal<T, E>(arg: string | ValueExtractor<T, E>, value: E): EqualsFilter<T, E> {
        if (!(arg instanceof ValueExtractor)) {
            return new EqualsFilter('EqualsFilter', new UniversalExtractor(arg), value);
        }
        return new EqualsFilter('EqualsFilter', arg, value);
    }

    /**
     * Return a filter that tests if the extracted value is greater than the
     * specified value.
     *
     * @param extractor  the ValueExtractor to use.
     * @param value      the value to compare the extracted value with.
     * @param <T>        the type of the object to extract value from.
     * @param <E>        the type of extracted value.
     *
     * @return  a filter that tests if the extracted value is greater than the
     *          specified value.
     *
     * @see GreaterFilter
     */   
    static greater<T, E>(fieldName: string, value: E): GreaterFilter<T, E>;
    static greater<T, E>(extractor: ValueExtractor<T, E>, value: E): GreaterFilter<T, E>;
    static greater<T, E>(arg: string | ValueExtractor<T, E>, value: E): GreaterFilter<T, E> {
        if (!(arg instanceof ValueExtractor)) {
            return new GreaterFilter(new UniversalExtractor(arg), value);
        }
        return new GreaterFilter(arg, value);
    }

        /**
     * Return a filter that tests if the extracted value is greater than or equal
     * to the specified value.
     *
     * @param extractor  the ValueExtractor to use.
     * @param value      the value to compare the extracted value with.
     * @param <T>        the type of the object to extract value from.
     * @param <E>        the type of extracted value.
     *
     * @return  a filter that tests if the extracted value is greater than or
     *          equal to the specified value.
     *
     * @see GreaterEqualsFilter
     */
    static greaterEqual<T, E>(fieldName: string, value: E): GreaterFilter<T, E>;
    static greaterEqual<T, E>(extractor: ValueExtractor<T, E>, value: E): GreaterFilter<T, E>;
    static greaterEqual<T, E>(arg: string | ValueExtractor<T, E>, value: E): GreaterFilter<T, E> {
        if (!(arg instanceof ValueExtractor)) {
            return new GreaterEqualsFilter(new UniversalExtractor(arg), value);
        }
        return new GreaterEqualsFilter(arg, value);
    }

    
    /**
     * Return a filter that tests if the extracted value is contained in the
     * specified array.
     *
     * @param extractor  the ValueExtractor to use.
     * @param values     the values to compare the extracted value with.
     * @param <T>        the type of the object to extract value from.
     * @param <E>        the type of extracted value.
     *
     * @return  a filter that tests if the extracted value is contained in the
     *          specified array.
     *
     * @see ContainsAnyFilter
     */
    static in<T, E>(extractor: ValueExtractor<T, E>, ...values: E[]): Filter<T>;
    static in<T, E>(extractor: ValueExtractor<T, E>, values: Set<E>): Filter<T>;
    static in<T, E>(extractor: ValueExtractor<T, E>, values: E[] | Set<E>): Filter<T> {
        
        return new InFilter(extractor, (values instanceof Set) ? values : new Set(values));
    }

    /**
     * Return a filter that evaluates to true for non-null values.
     *
     * @param extractor  the Extractor to use.
     * @param <T>        the type of the object to extract value from.
     * @param <E>        the type of extracted value.
     *
     * @return a filter that evaluates to true for non-null values.
     *
     * @see IsNotNullFilter
     */
    static isNotNull<T, E>(extractor: ValueExtractor<T, E>): IsNotNullFilter<T, E> {
        return new IsNotNullFilter(extractor);
    }

    /**
     * Return a filter that evaluates to true for null values.
     *
     * @param extractor  the Extractor to use.
     * @param <T>        the type of the object to extract value from.
     * @param <E>        the type of extracted value.
     *
     * @return a filter that evaluates to true for null values.
     *
     * @see IsNullFilter
     */
    static isNull<T, E>(extractor: ValueExtractor<T, E>): IsNotNullFilter<T, E> {
        return new IsNullFilter(extractor);
    }

    /**
     * Return a filter that tests if the extracted value is less than the
     * specified value.
     *
     * @param extractor  the ValueExtractor to use
     * @param value      the value to compare the extracted value with
     * @param <T>        the type of the object to extract value from
     * @param <E>        the type of extracted value
     *
     * @return  a filter that tests if the extracted value is less than the
     *          specified value
     *
     * @see LessFilter
     */
    static less<T, E>(extractor: ValueExtractor<T, E>, value: E): Filter<T> {
        return new LessFilter(extractor, value);
    }

    /**
     * Return a filter that tests if the extracted value is less than or equal
     * to the specified value.
     *
     * @param extractor  the ValueExtractor to use
     * @param value      the value to compare the extracted value with
     * @param <T>        the type of the object to extract value from
     * @param <E>        the type of extracted value
     *
     * @return  a filter that tests if the extracted value is less than or equal
     *          to the specified value
     *
     * @see LessEqualsFilter
     */
    static lessEqual<T, E>(extractor: ValueExtractor<T, E>, value: E): Filter<T> {
        return new LessEqualsFilter(extractor, value);
    }

    /**
     * Return a LikeFilter for pattern match.
     *
     * @param extractor  the ValueExtractor to use by this filter
     * @param pattern    the string pattern to compare the result with
     * @param escape     the escape character for escaping '%' and '_'
     * @param ignoreCase true to be case-insensitive
     * @param <T>        the type of the object to extract value from
     * @param <E>        the type of extracted value
     *
     * @return a LikeFilter
     */
    static like<T, E>(extractor: ValueExtractor<T, E>, pattern: string, escape: string, ignoreCase: boolean): Filter<T> {
        return new LikeFilter(extractor, pattern, escape, ignoreCase);
    }

  
    
    static greaterEquals<T, E>(property: string, value: E): GreaterEqualsFilter<T, E>;
    static greaterEquals<T, E>(extractor: ValueExtractor<T, E>, value: E): GreaterEqualsFilter<T, E>;
    static greaterEquals<T, E>(arg: any, value: E): GreaterEqualsFilter<T, E> {
        if ((typeof arg) === 'string') {
            return new GreaterEqualsFilter(new UniversalExtractor(arg), value);
        }
        return new GreaterEqualsFilter(arg, value);
    }

    /**
     * Return a filter that always evaluates to false.
     *
     * @return a filter that always evaluates to false.
     *
     * @see NeverFilter
     */
    static never<T>(): Filter<T> {
        return Filters.NEVER_INSTANCE;
    }

    /**
     * Return a filter that represents the logical negation of the specified
     * filter.
     *
     * @param <T>     the type of the input argument to the filter.
     * @param filter  the filter.
     *
     * @return  a filter that represents the logical negation of the specified
     *          filter.
     *
     * @see NotFilter
     */
    static not<T>(filter: Filter<T>): Filter<T> {
        return new NotFilter(filter);
    }

    /**
     * Return a filter that tests for non-equality.
     *
     * @param extractor  the ValueExtractor to use
     * @param value      the value to compare the extracted value with
     * @param <T>        the type of the object to extract value from
     * @param <E>        the type of extracted value
     *
     * @return a filter that tests for non-equality
     *
     * @see NotEqualsFilter
     */
    static notEqual<T, E>(extractor: ValueExtractor<T, E>, value: E): Filter<T> {
        return new NotEqualsFilter('NotEqualsFilter', extractor, value);
    }


    /**
     * Return a PredicateFilter for a given {@code Predicate}.
     *
     * @param predicate the predicate to evaluate.
     * @param <T>       the type of the object to evaluate.
     *
     * @return a PredicateFilter.
     * 
     * @see PredicateFilter
     */
    static predicate<T, E>(predicate: {'@class': string}, extractorOrNull?: ValueExtractor<T, E> | undefined): Filter<T> {
        return new PredicateFilter(predicate, extractorOrNull);
    }

    /**
     * Return a filter that evaluates to true if an entry is present in the cache.
     *
     * @return a filter that evaluates to true if an entry is present
     *
     * @see PresentFilter
     */
    static present<T>(): Filter<T> {
        return PresentFilter.INSTANCE;
    }

    /**
     * Return a RegexFilter for pattern match.
     *
     * @param extractor the ValueExtractor to use by this filter.
     * @param regex     the regular expression to match the result with.
     * @param <T>       the type of the object to extract value from.
     * @param <E>       the type of extracted value.
     *
     * @return a RegexFilter
     */
    static regex<T, E>(extractor: ValueExtractor<T, E>, regex: string): Filter<T> {
        return new RegexFilter(extractor, regex);
    }
    
}
