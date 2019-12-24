
import { ValueExtractor } from './value_extractor';
import { Util } from '../util/util';

export enum Target {
    VALUE = 0,

    KEY = 1
};

export class AbstractExtractor<T, E>
    implements ValueExtractor<T, E> {

    '@class': string;

    target?: Target;

    constructor(typeName: string, target?: Target | undefined) {
        this['@class'] = Util.fqExtractorName(typeName);
        if (target) {
            this.target = target;
        }
    }

    getTarget(): Target {
        if (!this.target) {
            throw new Error('Internal error; unknown target');
        }
        return this.target;
    }

}