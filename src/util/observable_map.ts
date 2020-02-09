import { MapListener } from "./map_listener";
import { MapEventFilter } from "../filter/map_event_filter";

export interface ObservableMap<K=any, V=any> {
    
    addMapListener(listener: MapListener<K, V>, isLite?: boolean): void;

    addMapListener(listener: MapListener<K, V>, key: K, isLite?: boolean): void;

    addMapListener(listener: MapListener<K, V>, filter: MapEventFilter, isLite?: boolean): void;
}