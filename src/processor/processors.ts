import { EntryProcessor } from "./entry_processor";
import { ExtractorProcessor } from "./extractor_processor";
import { Filter } from "../filter/filter";
import { ConditionalPutProcessor } from "./contitional_put_processor";
import { ConditionalPutAllProcessor } from "./contitional_put_all_processor";

export class Processors {

    static extract<K, V, R>(fieldName?: string): EntryProcessor<K, V, R> {
        return new ExtractorProcessor(fieldName);
    }

    static conditionalPut<K, V>(filter: Filter<V>, value: V, returnValue?: boolean): ConditionalPutProcessor<K, V> {
        return new ConditionalPutProcessor(filter, value, returnValue);
    }

  
    static conditionalPutAll<K, V>(filter: Filter<V>, values: Map<K, V>): ConditionalPutAllProcessor<K, V> {
        return new ConditionalPutAllProcessor(filter, values);
    }
  
}