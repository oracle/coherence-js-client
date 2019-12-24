
import { ValueExtractor } from './value_extractor';
import { AbstractCompositeExtractor } from './abstract_composite_extractor';
import { Target } from './abstract_extractor';
import { ReflectionExtractor } from './reflection_extractor';

export class ChainedExtractor<T, E>
    extends AbstractCompositeExtractor<T, E> {

    constructor(extractors: ValueExtractor<T, E>[]);
    constructor(extractors: string);
    constructor(extractors: ValueExtractor<T, E>[] | string) {
        if (typeof extractors === 'string') {
            super('ChainedExtractor', ChainedExtractor.createExtractors(extractors));
        } 
        this.target = this.computeTarget();
    }

    protected computeTarget(): Target {
        const aExtractor = this.extractors;

        let result = Target.VALUE;
        if (aExtractor != null && aExtractor.length > 0) {
            const extType: string = typeof aExtractor[0];
            if (extType === 'AbstractExtractor') {
                result = aExtractor[0].getTarget();
            }
        }
        return result;
    }

    protected merge(head: ValueExtractor<any, any>[], tail: ValueExtractor<any, any>[]): ValueExtractor<any, any>[] {
        const arr = new Array();
        arr.concat(head);
        arr.concat(tail);

        return arr;
    }

    protected static createExtractors(fields: string): ValueExtractor<any, any>[] {
        const names = fields.split('.').filter(f => f != null && f.length > 0);
        let arr = new Array<ValueExtractor<any, any>>();
        for (let name of names) {
            arr.concat(new ReflectionExtractor(name));
        }

        return arr;
    }
}