import { ConcurrentMap } from "./concurrent_map";
import { QueryMap } from "./query_map";
import { RemoteCache } from "./remote_cache";
import { InvocableMap } from './invocable_map';



export interface NamedCache<K, V>
    extends ConcurrentMap<K, V>, InvocableMap<K, V>, QueryMap<K, V>, RemoteCache<K, V> {

}