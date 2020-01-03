import { ConcurrentMap } from "./concurrent_map";
import { QueryMap } from "./query_map";
import { RemoteCache } from "./remote_cache";



export interface NamedCache<K, V>
    extends ConcurrentMap<K, V>, QueryMap<K, V>, RemoteCache<K, V> {


}