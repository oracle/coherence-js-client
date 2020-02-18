import { ObservableMap } from "./observable_map";
import { Serializer } from "./serializer";
import { MapEventResponse } from "../cache/proto/messages_pb";

export class MapEvent<K = any, V = any> {

    /**
     * This event indicates that an entry has been added to the map.
     */
    static ENTRY_INSERTED = 1;

    /**
     * This event indicates that an entry has been updated in the map.
     */
    static ENTRY_UPDATED = 2;

    /**
     * This event indicates that an entry has been removed from the map.
     */
    static ENTRY_DELETED = 3;

    cacheName: string;

    source: ObservableMap<K, V>;

    id: number;

    keyBytes: Uint8Array;

    newValueBytes?: Uint8Array;

    oldValueBytes?: Uint8Array;

    private key?: K;

    private newValue?: V;

    private oldValue?: V;

    private filterIDs: Array<number>;

    private serializer: Serializer;

    constructor(cacheName: string, source: ObservableMap<K, V>, mapEvent: MapEventResponse, serializer: Serializer) {        
        this.cacheName = cacheName;
        this.source = source;
        this.serializer = serializer;
        this.id = mapEvent.getId();
        this.keyBytes = mapEvent.getKey_asU8();
        this.newValueBytes = mapEvent.getNewvalue_asU8();
        this.oldValueBytes = mapEvent.getOldvalue_asU8();
        this.filterIDs = mapEvent.getFilteridsList();
    }

    getName(): string {
        return this.cacheName;
    }

    getMap(): ObservableMap<K, V> {
        return this.source;
    }

    getId(): number {
        return this.id;
    }

    getDescription(): string {
        return MapEvent.getDescription(this.id);
    }

    getKey(): K {
        if (!this.key) {
            this.key = this.serializer.deserialize(this.keyBytes);
        }
        if (!this.key) {
            throw new Error('unable to deserialize key using format: ' + this.serializer.format());
        }
        return this.key;
    }

    getOldValue(): V | undefined {
        if (!this.oldValue && this.oldValueBytes) {
            this.oldValue = this.serializer.deserialize(this.oldValueBytes);
        }
        return this.oldValue;
    }

    getNewValue(): V | undefined {
        if (!this.newValue && this.newValueBytes) {
            this.newValue = this.serializer.deserialize(this.newValueBytes);
        }
        return this.newValue;
    }

    static getDescription(eventId: number) {
        switch (eventId) {
            case MapEvent.ENTRY_INSERTED:
                return "inserted";

            case MapEvent.ENTRY_UPDATED:
                return "updated";

            case MapEvent.ENTRY_DELETED:
                return "deleted";

            default:
                return "<unknown: " + eventId + '>';
        }
    }

    print(): void {
        console.log("MapEvent: ");
        console.log("\t Key          : " + JSON.stringify(this.getKey()));
        console.log("\t Type         : " + JSON.stringify(MapEvent.getDescription(this.getId())));
        console.log("\t Source Name  : " + JSON.stringify(this.cacheName));
        console.log("\t Old Value    : " + JSON.stringify(this.getOldValue()));
        console.log("\t New Value    : " + JSON.stringify(this.getNewValue()));
        console.log("\t Filter IDs   : " + JSON.stringify(this.filterIDs));
    }
}