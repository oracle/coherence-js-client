import { ValueSet } from "../cache/streamed_collection";

export class Serializer {

    private static JSON_SERIALIZER_PREFIX: number = 21;

    public static serialize(obj: any): Buffer {
        const str = JSON.stringify(obj);
        const buf = Buffer.alloc(str.length + 1);

        buf.writeInt8(this.JSON_SERIALIZER_PREFIX, 0);  // Write at index 0
        buf.write(str, 1);                              // Write at index 1

        return buf;
    }

    public static deserialize(value: any): any {
        if (value && value.length > 0) {
            let buf = Buffer.from(value);
            if (buf.length > 0) {
                if (buf.readInt8(0) == this.JSON_SERIALIZER_PREFIX) {
                    buf = buf.slice(1);
                }
                return JSON.parse(buf.toString());
            }
        }
        return null;
    }

    static printJSON(message: string, obj: any): void {
        console.log(message + JSON.stringify(Serializer.deserialize(Serializer.serialize(obj))));
    }

}