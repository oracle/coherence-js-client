
import { AbstractCompositeExtractor, ReflectionExtractor, ChainedExtractor, ValueExtractor } from './value_extractor';

export class MultiExtractor
    extends AbstractCompositeExtractor {

    constructor(extractors: ValueExtractor[]);
    constructor(methodNames: string);
    constructor(extractorsOrMethod: ValueExtractor[] | string) {
        if (typeof extractorsOrMethod === 'string') {
            super('MultiExtractor', MultiExtractor.createExtractors(extractorsOrMethod));
        } else {
            super('MultiExtractor', extractorsOrMethod);
        }
    }

    protected static createExtractors(fields: string): ValueExtractor<any, any>[] {
        const names = fields.split(',').filter(f => f != null && f.length > 0);
        let arr = new Array<ValueExtractor<any, any>>();
        for (let name of names) {
            arr.concat(name.indexOf('.') < 0 ? new ReflectionExtractor(name) : new ChainedExtractor(name));
        }

        return arr;
    }
}