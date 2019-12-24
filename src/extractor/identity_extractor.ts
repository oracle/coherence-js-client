
import { AbstractExtractor, Target } from './abstract_extractor';

export class IdentityExtractor<T>
    extends AbstractExtractor<T, T> {

    constructor() {
        super('IdentityExtractor');
    }
}