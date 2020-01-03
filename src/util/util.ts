import { Serializer } from "./serializer";

export class Util {
    
    static EXTRACTOR_PACKAGE = 'com.tangosol.util.extractor.';

    static FILTER_PACKAGE = 'com.tangosol.util.filter.';

    static PROCESSOR_PACKAGE = 'com.tangosol.util.processor.';

    static AGGREGATOR_PACKAGE = 'com.tangosol.util.aggregator.';

    static BEAN_ACCESSOR_PREFIXES: string[] = ['get', 'set'];

    static METHOD_SUFFIX: string = '()';

    static ensureNotNull(property: any | undefined | null, message: string) {
        if (!property) {
            throw new Error(message);
        }
    }

    static ensureNotEmpty(arr: any[] | undefined | null, message: string) {
        if (arr == null || arr.length == 0) {
            throw new Error(message);
        }
    }

    static ensureValidMethodSuffix(name: string) {
        if (!name.endsWith(this.METHOD_SUFFIX)) {
            const message = "UniversalExtractor constructor: parameter sName[value:" + name + "] must end with "
                + "method suffix '" + Util.METHOD_SUFFIX + "' when optional parameters provided";
            throw new Error(message);
        }
    }

    static toFilterName(name: string): string {
        return this.FILTER_PACKAGE + name;
    }

    static toExtractorName(name: string): string {
        return this.EXTRACTOR_PACKAGE + name;
    }
    
}