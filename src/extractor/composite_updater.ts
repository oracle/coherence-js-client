import { ValueManipulator } from "../processor/value_manipulator";
import { ValueUpdater } from "../processor/value_updater";
import { ValueExtractor } from "./value_extractor";

export class CompositeUpdater
    implements ValueUpdater, ValueManipulator {

    extractor: ValueExtractor;

    updater: ValueUpdater;

    constructor(extractor: ValueExtractor, updater: ValueUpdater) {
        this.extractor = extractor;
        this.updater = updater;
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