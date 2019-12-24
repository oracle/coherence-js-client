
import { AbstractExtractor, Target } from './abstract_extractor';
import { ValueExtractor } from './value_extractor';

export class AbstractCompositeExtractor<T, E>
    extends AbstractExtractor<T, T> {

    extractors: ValueExtractor<T, E>[];

    constructor(typeName: string, extractors: ValueExtractor<T, E>[]) {
        super(typeName);
        this.extractors = extractors;
    }
}