
import { ValueExtractor } from './value_extractor';

export class UniversalExtractor<T = any, E = any>
    extends ValueExtractor<T, E> {

    name: string;

    params?: any[];

    constructor(name: string, params?: any[]) {
        super('UniversalExtractor');
        this.name = name;
        if (params) {
            this.params = params;
        }
    }

}