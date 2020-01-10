import { ValueManipulator } from "../processor/value_manipulator";
import { ValueUpdater } from "../processor/value_updater";
import { ValueExtractor, IdentityExtractor, ChainedExtractor } from "./value_extractor";
import { Util } from "../util/util";
import { UniversalUpdater } from "./universal_updater";

export class CompositeUpdater
    implements ValueUpdater, ValueManipulator {

    extractor: ValueExtractor;

    updater: ValueUpdater;

    constructor(method: string);
    constructor(extractor: ValueExtractor, updater: ValueUpdater);
    constructor(methodOrExtractor: string | ValueExtractor, updater?: ValueUpdater) {
        if (updater) {
            // Two arg constructor
            this.extractor = methodOrExtractor as ValueExtractor;
            this.updater = updater;
        } else {
            // One arge with method name
            const methodName = methodOrExtractor as string;
            Util.ensureNonEmptyString(methodName, "method name has to be non empty");

            const last = methodName.lastIndexOf('.');
            this.extractor = last == -1
                ? IdentityExtractor.INSTANCE
                : new ChainedExtractor(methodName.substring(0, last));
            this.updater = new UniversalUpdater(methodName.substring(last + 1));
        }
    }
    
    update(target: any, value: any): void {
        throw new Error("Method not implemented.");
    }

    getExtractor(): ValueExtractor {
        throw new Error("Method not implemented.");
    }

    getUpdater(): ValueUpdater {
        throw new Error("Method not implemented.");
    }

}