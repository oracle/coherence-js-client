
import { ValueExtractor } from './value_extractor';

export class IdentityExtractor<T>
    extends ValueExtractor<T, T> {

    public static INSTANCE = new IdentityExtractor();
    
    constructor() {
        super('IdentityExtractor');
    }
}