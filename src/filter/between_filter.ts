import { ComparisonFilter, AndFilter } from './filter';
import { ValueExtractor } from '../extractor/value_extractor';
import { GreaterEqualsFilter } from './greater_equals_filter';
import { LessEqualsFilter } from './less_equals_filter';
import { LessFilter } from './less_filter';
import { GreaterFilter } from './greater_filter';

/**
 * Filter which compares the result of a method invocation with a value for
 * "Between" condition.  We use the standard ISO/IEC 9075:1992 semantic,
 * according to which "X between Y and Z" is equivalent to "X &gt;= Y &amp;&amp; X &lt;= Z".
 * In a case when either result of a method invocation or a value to compare
 * are equal to null, the <tt>evaluate</tt> test yields <tt>false</tt>.
 * This approach is equivalent to the way the NULL values are handled by SQL.
 *
 * @param <T> the type of the input argument to the filter
 * @param <E> the type of the extracted attribute to use for comparison
*/
export class BetweenFilter<T=any, E=any>
    extends AndFilter {

    private from: E;

    private to: E;

    constructor(extractor: ValueExtractor<T, E>, from: E, to: E, 
        includeLowerBound: boolean = false, includeUpperBound: boolean = false) 
    {
        super(includeLowerBound
                ? new GreaterEqualsFilter(extractor, from)
                : new GreaterFilter(extractor, from),
            includeUpperBound
                ? new LessEqualsFilter(extractor, to)
                : new LessFilter(extractor, to)
        );

        this.from = from;
        this.to = to;
    }
}