import { EntryProcessor } from "./entry_processor";
import { ExtractorProcessor } from "./extractor_processor";

export class Processors {

    static extract<K, V, R>(fieldName?: string): EntryProcessor<K, V, R> {
        return new ExtractorProcessor(fieldName);
    }
}