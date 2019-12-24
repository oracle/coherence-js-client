
import { AbstractExtractor, Target } from './abstract_extractor';

export class ReflectionExtractor<T, E>
    extends AbstractExtractor<T, E> {

    method: string;
    
    args?: any[];

    constructor(method: string, args?: any[], target?: Target | undefined) {
        super('ReflectionExtractor', target);
        this.method = method;
        if (args) {
            this.args = args;
        }
    }
}