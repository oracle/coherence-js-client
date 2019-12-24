
import { AbstractExtractor, Target } from './abstract_extractor';

export class UniversalExtractor<T, E>
    extends AbstractExtractor<T, E> {

    name: string;

    params?: any[];

    // constructor(name: string, params?: any[], target?: Target | undefined) {
    constructor(name: string) {
            super('UniversalExtractor');

        // Util.ensureNotNull(name, "name cannot be null");
        // if (params && params.length > 0) {
        //     Util.ensureValidMethodSuffix(name);
        // }

        this.name = name;
        // if (params) {
        //     this.params = params;
        // }
    }

}