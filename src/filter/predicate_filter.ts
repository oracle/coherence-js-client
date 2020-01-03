import { Filter, ExtractorFilter } from './filter';
import { ValueExtractor } from '../extractor/value_extractor';

/**
 * A {@code java.util.function.Predicate} based {@link ExtractorFilter}.
 */
export class PredicateFilter<T, E>
    extends ExtractorFilter<T, E> {

    /**
     * The 'Predicate' for filtering extracted values.
     */
    predicate: {'@class': string};

    /**
     * Constructs a {@link PredicateFilter}.
     *
     * @param predicate  predicate for testing the value. The object must
     *                   have an '@class' attribute.
     */
    constructor(predicate: {'@class': string}, extractor?: ValueExtractor<T, E> | undefined) {
        super('PredicateFilter', extractor ? extractor : ValueExtractor.identityCast());
        this.predicate = predicate;
    }

}