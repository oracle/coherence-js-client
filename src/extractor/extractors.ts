import { IdentityExtractor } from "./identity_extractor";
import { ValueExtractor } from "./value_extractor";
import { UniversalExtractor } from "./universal_extractor";
import { Util } from '../util/util';
import { ChainedExtractor } from "./chained_extractor";

export class Extractors {

    static identity<T>(): ValueExtractor<T, T> {
        return new IdentityExtractor<T>();
    }

    static extract<T, E>(from: string, params?: any[]): ValueExtractor<T, E> {
        if (params) {
            if (!from.endsWith(Util.METHOD_SUFFIX)) {
                from = from + Util.METHOD_SUFFIX;
            }
        }
        // return new UniversalExtractor(from, params);
        return new UniversalExtractor(from);
    }

    static chained<T, E>(...extractors: ValueExtractor<T, E>[]): ValueExtractor<T, E>;
    static chained<T, E>(...fields: string[]): ValueExtractor<T, E>;
    static chained<T, E>(...eOrF: (ValueExtractor<T, E> | string)[]): ValueExtractor<T, E> {
        Util.ensureNotEmpty(eOrF, "The extractors or field parameter cannot be null or empty");

        const extractors = new Array<ValueExtractor<T, E>>();
        if (typeof eOrF[0] === 'string') {
            for (let e of (eOrF as string[])) {
                if (e && e.length > 0) {    // filter null and empty
                    extractors.concat(Extractors.extract(e));
                }
            }
        } else {
            if (eOrF.length == 1) {
                return eOrF[0] as ValueExtractor<T, E>;
            }
            return new ChainedExtractor(eOrF as ValueExtractor<T, E>[]);
        }

        throw new Error('internal error');
    }

    static isValueExtractor<T, E>(e: any): e is ValueExtractor<T, E> {
        return (e as ValueExtractor<T, E>).getTarget !== undefined;
    }

    /*
    static multi(...fields: string[]) {

    }
    */
}