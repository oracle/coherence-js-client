import { ComparisonFilter } from './filter';
import { ValueExtractor } from '../extractor/value_extractor';

export class LikeFilter<T, E>
    extends ComparisonFilter<T, E, string> {

        escape?: string;
        ignoreCase: boolean;

    constructor(extractor: ValueExtractor<T, E>, pattern: string, escape: string = "", ignoreCase: boolean = false) {
        super('LikeFilter', extractor, pattern);

        if (escape && escape.length > 0 ) {
            this.escape = escape;
        }
        this.ignoreCase = ignoreCase ? ignoreCase : false;
    }

}