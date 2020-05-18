/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

/**
 * Serializer defines the set of methods for serializing
 * and deserializing objects. Additionally, the format() 
 * method describes the serialization format that this
 * Serializer is capable of handling.
 * 
 * Each Serializer implementation is registered with 
 * the SerializerRegistry.
 */
export interface Serializer {

    /**
     * Returns the serialization format that this
     * Serializer is capable of handling. 
     */
    format(): string;

    /**
     * Serializes the specified object and returns the
     * Buffer containing te\he serialized data. 
     * @param obj The object to be serialized.
     * 
     * @returns The Buffer containing the serialized data. 
     */
    serialize(obj: any): Buffer;

    /**
     * Deserializes the specified object and returns the
     * deserialized object. 
     * @param obj The object to be deserialized.
     * 
     * @returns The deserialized object. 
     */
    deserialize(value: any): any;

}

/**
 * A Serializer that serializes and deserializes objects
 * as JSON.
 */
class JSONSerializer
    implements Serializer {

    private static JSON_SERIALIZER_PREFIX: number = 21;

    public format(): string {
        return "json";
    }

    public serialize(obj: any): Buffer {
        const str = JSON.stringify(obj);
        const buf = Buffer.alloc(str.length + 1);

        buf.writeInt8(JSONSerializer.JSON_SERIALIZER_PREFIX, 0);  // Write at index 0
        buf.write(str, 1);                              // Write at index 1

        return buf;
    }

    public deserialize(value: any): any {
        if (value && value.length > 0) {
            let buf = Buffer.from(value);
            if (buf.length > 0) {
                if (buf.readInt8(0) == JSONSerializer.JSON_SERIALIZER_PREFIX) {
                    buf = buf.slice(1);
                }
                return JSON.parse(buf.toString());
            }
        }
        return null;
    }

}

/**
 * A singleton object that holds the collection of
 * avaliable Serializers.
 */
export class SerializerRegistry {

    private static singleton = new SerializerRegistry();

    private serializers = new Map<string, Serializer>();

    private constructor() {
        // Create and register all available serilizers.

        const jsonSerializer = new JSONSerializer();
        this.serializers.set(jsonSerializer.format(), jsonSerializer);
    }

    /**
     * A factory method for obtaining the singleton instance.
     * 
     * @returns The singleton SerializerRegistry instance.
     */
    public static instance(): SerializerRegistry {
        return SerializerRegistry.singleton;
    }

    /**
     * Returns the Serializer for the specified format.
     * @param format The required serialization format.
     * 
     * @returns The Serializer that is capable of Serializing
     *          objects in the specified format.
     */
    public serializer(format: string): Serializer {
        const serializer = SerializerRegistry.instance().serializers.get(format);
        if (!serializer) {
            throw new Error('No serializer registered for format: ' + format);
        }

        return serializer;
    }

}

