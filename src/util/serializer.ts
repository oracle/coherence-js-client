/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

/**
 * The `Serializer` interfaces defines the set of methods for serializing
 * and deserializing objects.
 */
export interface Serializer {

  /**
   * The serializer format.
   */
  readonly format: string;

  /**
   * Serializes the specified object and returns the
   * {@link Buffer} containing the serialized data.
   *
   * @param obj  the object to be serialized
   *
   * @returns the {@link Buffer} containing the serialized data.
   */
  serialize (obj: any): Buffer;

  /**
   * Deserializes and returns a new Javascript object.
   *
   * @param value The object to be deserialized.
   *
   * @returns The deserialized object.
   */
  deserialize (value: any): any;

}

/**
 * A Serializer implementation supporting `JSON` as payload format.
 */
class JSONSerializer
  implements Serializer {
  protected static JSON_SERIALIZER_PREFIX: number = 21
  private readonly _format: string = 'json'

  /**
   * @inheritDoc
   */
  get format (): string {
    return this._format
  }

  /**
   * @inheritDoc
   */
  public serialize (obj: any): Buffer {
    const str = JSON.stringify(obj)
    const buf = Buffer.alloc(str.length + 1)

    buf.writeInt8(JSONSerializer.JSON_SERIALIZER_PREFIX, 0) // Write at index 0
    buf.write(str, 1) // Write at index 1

    return buf
  }

  /**
   * @inheritDoc
   */
  public deserialize (value: any): any {
    if (value && value.length > 0) {
      let buf = Buffer.from(value)
      if (buf.length > 0) {
        if (buf.readInt8(0) == JSONSerializer.JSON_SERIALIZER_PREFIX) {
          buf = buf.slice(1)
        }
        return JSON.parse(buf.toString())
      }
    }
    return null
  }
}

/**
 * A singleton object that holds the collection of
 * available {@link Serializer}s.
 */
export class SerializerRegistry {
  static readonly singleton = new SerializerRegistry()

  /**
   * Mapping between ID and Serializer implementation.
   */
  protected serializers = new Map<string, Serializer>()

  private constructor () {
    const jsonSerializer = new JSONSerializer()
    this.serializers.set(jsonSerializer.format, jsonSerializer)
  }

  /**
   * A factory method for obtaining the singleton instance.
   *
   * @returns The singleton SerializerRegistry instance.
   */
  public static instance (): SerializerRegistry {
    return SerializerRegistry.singleton
  }

  /**
   * Returns the Serializer for the specified format.
   *
   * @param format  the required serialization format.
   *
   * @returns The Serializer that is capable of Serializing
   *          objects in the specified format.
   */
  public serializer (format: string): Serializer {
    const serializer = SerializerRegistry.instance().serializers.get(format)
    if (!serializer) {
      throw new Error('No serializer registered for format: ' + format)
    }

    return serializer
  }
}
