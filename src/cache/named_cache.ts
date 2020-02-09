import { ConcurrentMap } from "./concurrent_map";
import { QueryMap } from "./query_map";
import { RemoteCache } from "./remote_cache";
import { InvocableMap } from './invocable_map';
import { CacheMap } from "./cache_map";
import { ObservableMap } from "../util/observable_map";

export interface NamedCache<K, V>
    extends CacheMap<K, V>, 
            ConcurrentMap<K, V>, 
            InvocableMap<K, V>, 
            ObservableMap<K, V>, 
            RemoteCache<K, V>, 
            QueryMap<K, V> 
{
    getName(): string;
}