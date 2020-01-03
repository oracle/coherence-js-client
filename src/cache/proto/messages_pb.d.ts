// package: coherence
// file: messages.proto

import * as jspb from "google-protobuf";

export class ClearRequest extends jspb.Message {
  getCache(): string;
  setCache(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ClearRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ClearRequest): ClearRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ClearRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ClearRequest;
  static deserializeBinaryFromReader(message: ClearRequest, reader: jspb.BinaryReader): ClearRequest;
}

export namespace ClearRequest {
  export type AsObject = {
    cache: string,
  }
}

export class ContainsEntryRequest extends jspb.Message {
  getCache(): string;
  setCache(value: string): void;

  getFormat(): string;
  setFormat(value: string): void;

  getKey(): Uint8Array | string;
  getKey_asU8(): Uint8Array;
  getKey_asB64(): string;
  setKey(value: Uint8Array | string): void;

  getValue(): Uint8Array | string;
  getValue_asU8(): Uint8Array;
  getValue_asB64(): string;
  setValue(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ContainsEntryRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ContainsEntryRequest): ContainsEntryRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ContainsEntryRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ContainsEntryRequest;
  static deserializeBinaryFromReader(message: ContainsEntryRequest, reader: jspb.BinaryReader): ContainsEntryRequest;
}

export namespace ContainsEntryRequest {
  export type AsObject = {
    cache: string,
    format: string,
    key: Uint8Array | string,
    value: Uint8Array | string,
  }
}

export class ContainsKeyRequest extends jspb.Message {
  getCache(): string;
  setCache(value: string): void;

  getFormat(): string;
  setFormat(value: string): void;

  getKey(): Uint8Array | string;
  getKey_asU8(): Uint8Array;
  getKey_asB64(): string;
  setKey(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ContainsKeyRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ContainsKeyRequest): ContainsKeyRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ContainsKeyRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ContainsKeyRequest;
  static deserializeBinaryFromReader(message: ContainsKeyRequest, reader: jspb.BinaryReader): ContainsKeyRequest;
}

export namespace ContainsKeyRequest {
  export type AsObject = {
    cache: string,
    format: string,
    key: Uint8Array | string,
  }
}

export class ContainsValueRequest extends jspb.Message {
  getCache(): string;
  setCache(value: string): void;

  getFormat(): string;
  setFormat(value: string): void;

  getValue(): Uint8Array | string;
  getValue_asU8(): Uint8Array;
  getValue_asB64(): string;
  setValue(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ContainsValueRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ContainsValueRequest): ContainsValueRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ContainsValueRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ContainsValueRequest;
  static deserializeBinaryFromReader(message: ContainsValueRequest, reader: jspb.BinaryReader): ContainsValueRequest;
}

export namespace ContainsValueRequest {
  export type AsObject = {
    cache: string,
    format: string,
    value: Uint8Array | string,
  }
}

export class DestroyRequest extends jspb.Message {
  getCache(): string;
  setCache(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DestroyRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DestroyRequest): DestroyRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: DestroyRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DestroyRequest;
  static deserializeBinaryFromReader(message: DestroyRequest, reader: jspb.BinaryReader): DestroyRequest;
}

export namespace DestroyRequest {
  export type AsObject = {
    cache: string,
  }
}

export class IsEmptyRequest extends jspb.Message {
  getCache(): string;
  setCache(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): IsEmptyRequest.AsObject;
  static toObject(includeInstance: boolean, msg: IsEmptyRequest): IsEmptyRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: IsEmptyRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): IsEmptyRequest;
  static deserializeBinaryFromReader(message: IsEmptyRequest, reader: jspb.BinaryReader): IsEmptyRequest;
}

export namespace IsEmptyRequest {
  export type AsObject = {
    cache: string,
  }
}

export class SizeRequest extends jspb.Message {
  getCache(): string;
  setCache(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SizeRequest.AsObject;
  static toObject(includeInstance: boolean, msg: SizeRequest): SizeRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SizeRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SizeRequest;
  static deserializeBinaryFromReader(message: SizeRequest, reader: jspb.BinaryReader): SizeRequest;
}

export namespace SizeRequest {
  export type AsObject = {
    cache: string,
  }
}

export class GetRequest extends jspb.Message {
  getCache(): string;
  setCache(value: string): void;

  getFormat(): string;
  setFormat(value: string): void;

  getKey(): Uint8Array | string;
  getKey_asU8(): Uint8Array;
  getKey_asB64(): string;
  setKey(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetRequest): GetRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GetRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetRequest;
  static deserializeBinaryFromReader(message: GetRequest, reader: jspb.BinaryReader): GetRequest;
}

export namespace GetRequest {
  export type AsObject = {
    cache: string,
    format: string,
    key: Uint8Array | string,
  }
}

export class GetAllRequest extends jspb.Message {
  getCache(): string;
  setCache(value: string): void;

  getFormat(): string;
  setFormat(value: string): void;

  clearKeyList(): void;
  getKeyList(): Array<Uint8Array | string>;
  getKeyList_asU8(): Array<Uint8Array>;
  getKeyList_asB64(): Array<string>;
  setKeyList(value: Array<Uint8Array | string>): void;
  addKey(value: Uint8Array | string, index?: number): Uint8Array | string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetAllRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetAllRequest): GetAllRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GetAllRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetAllRequest;
  static deserializeBinaryFromReader(message: GetAllRequest, reader: jspb.BinaryReader): GetAllRequest;
}

export namespace GetAllRequest {
  export type AsObject = {
    cache: string,
    format: string,
    keyList: Array<Uint8Array | string>,
  }
}

export class PutRequest extends jspb.Message {
  getCache(): string;
  setCache(value: string): void;

  getFormat(): string;
  setFormat(value: string): void;

  getKey(): Uint8Array | string;
  getKey_asU8(): Uint8Array;
  getKey_asB64(): string;
  setKey(value: Uint8Array | string): void;

  getValue(): Uint8Array | string;
  getValue_asU8(): Uint8Array;
  getValue_asB64(): string;
  setValue(value: Uint8Array | string): void;

  getTtl(): number;
  setTtl(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PutRequest.AsObject;
  static toObject(includeInstance: boolean, msg: PutRequest): PutRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PutRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PutRequest;
  static deserializeBinaryFromReader(message: PutRequest, reader: jspb.BinaryReader): PutRequest;
}

export namespace PutRequest {
  export type AsObject = {
    cache: string,
    format: string,
    key: Uint8Array | string,
    value: Uint8Array | string,
    ttl: number,
  }
}

export class PutAllRequest extends jspb.Message {
  getCache(): string;
  setCache(value: string): void;

  getFormat(): string;
  setFormat(value: string): void;

  clearEntryList(): void;
  getEntryList(): Array<Entry>;
  setEntryList(value: Array<Entry>): void;
  addEntry(value?: Entry, index?: number): Entry;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PutAllRequest.AsObject;
  static toObject(includeInstance: boolean, msg: PutAllRequest): PutAllRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PutAllRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PutAllRequest;
  static deserializeBinaryFromReader(message: PutAllRequest, reader: jspb.BinaryReader): PutAllRequest;
}

export namespace PutAllRequest {
  export type AsObject = {
    cache: string,
    format: string,
    entryList: Array<Entry.AsObject>,
  }
}

export class PutIfAbsentRequest extends jspb.Message {
  getCache(): string;
  setCache(value: string): void;

  getFormat(): string;
  setFormat(value: string): void;

  getKey(): Uint8Array | string;
  getKey_asU8(): Uint8Array;
  getKey_asB64(): string;
  setKey(value: Uint8Array | string): void;

  getValue(): Uint8Array | string;
  getValue_asU8(): Uint8Array;
  getValue_asB64(): string;
  setValue(value: Uint8Array | string): void;

  getTtl(): number;
  setTtl(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PutIfAbsentRequest.AsObject;
  static toObject(includeInstance: boolean, msg: PutIfAbsentRequest): PutIfAbsentRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PutIfAbsentRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PutIfAbsentRequest;
  static deserializeBinaryFromReader(message: PutIfAbsentRequest, reader: jspb.BinaryReader): PutIfAbsentRequest;
}

export namespace PutIfAbsentRequest {
  export type AsObject = {
    cache: string,
    format: string,
    key: Uint8Array | string,
    value: Uint8Array | string,
    ttl: number,
  }
}

export class RemoveRequest extends jspb.Message {
  getCache(): string;
  setCache(value: string): void;

  getFormat(): string;
  setFormat(value: string): void;

  getKey(): Uint8Array | string;
  getKey_asU8(): Uint8Array;
  getKey_asB64(): string;
  setKey(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RemoveRequest.AsObject;
  static toObject(includeInstance: boolean, msg: RemoveRequest): RemoveRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RemoveRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RemoveRequest;
  static deserializeBinaryFromReader(message: RemoveRequest, reader: jspb.BinaryReader): RemoveRequest;
}

export namespace RemoveRequest {
  export type AsObject = {
    cache: string,
    format: string,
    key: Uint8Array | string,
  }
}

export class RemoveMappingRequest extends jspb.Message {
  getCache(): string;
  setCache(value: string): void;

  getFormat(): string;
  setFormat(value: string): void;

  getKey(): Uint8Array | string;
  getKey_asU8(): Uint8Array;
  getKey_asB64(): string;
  setKey(value: Uint8Array | string): void;

  getValue(): Uint8Array | string;
  getValue_asU8(): Uint8Array;
  getValue_asB64(): string;
  setValue(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RemoveMappingRequest.AsObject;
  static toObject(includeInstance: boolean, msg: RemoveMappingRequest): RemoveMappingRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RemoveMappingRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RemoveMappingRequest;
  static deserializeBinaryFromReader(message: RemoveMappingRequest, reader: jspb.BinaryReader): RemoveMappingRequest;
}

export namespace RemoveMappingRequest {
  export type AsObject = {
    cache: string,
    format: string,
    key: Uint8Array | string,
    value: Uint8Array | string,
  }
}

export class ReplaceRequest extends jspb.Message {
  getCache(): string;
  setCache(value: string): void;

  getFormat(): string;
  setFormat(value: string): void;

  getKey(): Uint8Array | string;
  getKey_asU8(): Uint8Array;
  getKey_asB64(): string;
  setKey(value: Uint8Array | string): void;

  getValue(): Uint8Array | string;
  getValue_asU8(): Uint8Array;
  getValue_asB64(): string;
  setValue(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ReplaceRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ReplaceRequest): ReplaceRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ReplaceRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ReplaceRequest;
  static deserializeBinaryFromReader(message: ReplaceRequest, reader: jspb.BinaryReader): ReplaceRequest;
}

export namespace ReplaceRequest {
  export type AsObject = {
    cache: string,
    format: string,
    key: Uint8Array | string,
    value: Uint8Array | string,
  }
}

export class ReplaceMappingRequest extends jspb.Message {
  getCache(): string;
  setCache(value: string): void;

  getFormat(): string;
  setFormat(value: string): void;

  getKey(): Uint8Array | string;
  getKey_asU8(): Uint8Array;
  getKey_asB64(): string;
  setKey(value: Uint8Array | string): void;

  getPreviousvalue(): Uint8Array | string;
  getPreviousvalue_asU8(): Uint8Array;
  getPreviousvalue_asB64(): string;
  setPreviousvalue(value: Uint8Array | string): void;

  getNewvalue(): Uint8Array | string;
  getNewvalue_asU8(): Uint8Array;
  getNewvalue_asB64(): string;
  setNewvalue(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ReplaceMappingRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ReplaceMappingRequest): ReplaceMappingRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ReplaceMappingRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ReplaceMappingRequest;
  static deserializeBinaryFromReader(message: ReplaceMappingRequest, reader: jspb.BinaryReader): ReplaceMappingRequest;
}

export namespace ReplaceMappingRequest {
  export type AsObject = {
    cache: string,
    format: string,
    key: Uint8Array | string,
    previousvalue: Uint8Array | string,
    newvalue: Uint8Array | string,
  }
}

export class PageRequest extends jspb.Message {
  getCache(): string;
  setCache(value: string): void;

  getFormat(): string;
  setFormat(value: string): void;

  getCookie(): Uint8Array | string;
  getCookie_asU8(): Uint8Array;
  getCookie_asB64(): string;
  setCookie(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PageRequest.AsObject;
  static toObject(includeInstance: boolean, msg: PageRequest): PageRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PageRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PageRequest;
  static deserializeBinaryFromReader(message: PageRequest, reader: jspb.BinaryReader): PageRequest;
}

export namespace PageRequest {
  export type AsObject = {
    cache: string,
    format: string,
    cookie: Uint8Array | string,
  }
}

export class EntryResult extends jspb.Message {
  getKey(): Uint8Array | string;
  getKey_asU8(): Uint8Array;
  getKey_asB64(): string;
  setKey(value: Uint8Array | string): void;

  getValue(): Uint8Array | string;
  getValue_asU8(): Uint8Array;
  getValue_asB64(): string;
  setValue(value: Uint8Array | string): void;

  getCookie(): Uint8Array | string;
  getCookie_asU8(): Uint8Array;
  getCookie_asB64(): string;
  setCookie(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EntryResult.AsObject;
  static toObject(includeInstance: boolean, msg: EntryResult): EntryResult.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: EntryResult, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EntryResult;
  static deserializeBinaryFromReader(message: EntryResult, reader: jspb.BinaryReader): EntryResult;
}

export namespace EntryResult {
  export type AsObject = {
    key: Uint8Array | string,
    value: Uint8Array | string,
    cookie: Uint8Array | string,
  }
}

export class Entry extends jspb.Message {
  getKey(): Uint8Array | string;
  getKey_asU8(): Uint8Array;
  getKey_asB64(): string;
  setKey(value: Uint8Array | string): void;

  getValue(): Uint8Array | string;
  getValue_asU8(): Uint8Array;
  getValue_asB64(): string;
  setValue(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Entry.AsObject;
  static toObject(includeInstance: boolean, msg: Entry): Entry.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Entry, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Entry;
  static deserializeBinaryFromReader(message: Entry, reader: jspb.BinaryReader): Entry;
}

export namespace Entry {
  export type AsObject = {
    key: Uint8Array | string,
    value: Uint8Array | string,
  }
}

export class TruncateRequest extends jspb.Message {
  getCache(): string;
  setCache(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TruncateRequest.AsObject;
  static toObject(includeInstance: boolean, msg: TruncateRequest): TruncateRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: TruncateRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TruncateRequest;
  static deserializeBinaryFromReader(message: TruncateRequest, reader: jspb.BinaryReader): TruncateRequest;
}

export namespace TruncateRequest {
  export type AsObject = {
    cache: string,
  }
}

export class AddIndexRequest extends jspb.Message {
  getCache(): string;
  setCache(value: string): void;

  getFormat(): string;
  setFormat(value: string): void;

  getExtractor(): Uint8Array | string;
  getExtractor_asU8(): Uint8Array;
  getExtractor_asB64(): string;
  setExtractor(value: Uint8Array | string): void;

  getSorted(): boolean;
  setSorted(value: boolean): void;

  getComparator(): Uint8Array | string;
  getComparator_asU8(): Uint8Array;
  getComparator_asB64(): string;
  setComparator(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AddIndexRequest.AsObject;
  static toObject(includeInstance: boolean, msg: AddIndexRequest): AddIndexRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AddIndexRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AddIndexRequest;
  static deserializeBinaryFromReader(message: AddIndexRequest, reader: jspb.BinaryReader): AddIndexRequest;
}

export namespace AddIndexRequest {
  export type AsObject = {
    cache: string,
    format: string,
    extractor: Uint8Array | string,
    sorted: boolean,
    comparator: Uint8Array | string,
  }
}

export class RemoveIndexRequest extends jspb.Message {
  getCache(): string;
  setCache(value: string): void;

  getFormat(): string;
  setFormat(value: string): void;

  getExtractor(): Uint8Array | string;
  getExtractor_asU8(): Uint8Array;
  getExtractor_asB64(): string;
  setExtractor(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RemoveIndexRequest.AsObject;
  static toObject(includeInstance: boolean, msg: RemoveIndexRequest): RemoveIndexRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RemoveIndexRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RemoveIndexRequest;
  static deserializeBinaryFromReader(message: RemoveIndexRequest, reader: jspb.BinaryReader): RemoveIndexRequest;
}

export namespace RemoveIndexRequest {
  export type AsObject = {
    cache: string,
    format: string,
    extractor: Uint8Array | string,
  }
}

export class AggregateRequest extends jspb.Message {
  getCache(): string;
  setCache(value: string): void;

  getFormat(): string;
  setFormat(value: string): void;

  getAggregator(): Uint8Array | string;
  getAggregator_asU8(): Uint8Array;
  getAggregator_asB64(): string;
  setAggregator(value: Uint8Array | string): void;

  clearKeysList(): void;
  getKeysList(): Array<Uint8Array | string>;
  getKeysList_asU8(): Array<Uint8Array>;
  getKeysList_asB64(): Array<string>;
  setKeysList(value: Array<Uint8Array | string>): void;
  addKeys(value: Uint8Array | string, index?: number): Uint8Array | string;

  getFilter(): Uint8Array | string;
  getFilter_asU8(): Uint8Array;
  getFilter_asB64(): string;
  setFilter(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AggregateRequest.AsObject;
  static toObject(includeInstance: boolean, msg: AggregateRequest): AggregateRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AggregateRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AggregateRequest;
  static deserializeBinaryFromReader(message: AggregateRequest, reader: jspb.BinaryReader): AggregateRequest;
}

export namespace AggregateRequest {
  export type AsObject = {
    cache: string,
    format: string,
    aggregator: Uint8Array | string,
    keysList: Array<Uint8Array | string>,
    filter: Uint8Array | string,
  }
}

export class InvokeRequest extends jspb.Message {
  getCache(): string;
  setCache(value: string): void;

  getFormat(): string;
  setFormat(value: string): void;

  getProcessor(): Uint8Array | string;
  getProcessor_asU8(): Uint8Array;
  getProcessor_asB64(): string;
  setProcessor(value: Uint8Array | string): void;

  getKey(): Uint8Array | string;
  getKey_asU8(): Uint8Array;
  getKey_asB64(): string;
  setKey(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InvokeRequest.AsObject;
  static toObject(includeInstance: boolean, msg: InvokeRequest): InvokeRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: InvokeRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InvokeRequest;
  static deserializeBinaryFromReader(message: InvokeRequest, reader: jspb.BinaryReader): InvokeRequest;
}

export namespace InvokeRequest {
  export type AsObject = {
    cache: string,
    format: string,
    processor: Uint8Array | string,
    key: Uint8Array | string,
  }
}

export class InvokeAllRequest extends jspb.Message {
  getCache(): string;
  setCache(value: string): void;

  getFormat(): string;
  setFormat(value: string): void;

  getProcessor(): Uint8Array | string;
  getProcessor_asU8(): Uint8Array;
  getProcessor_asB64(): string;
  setProcessor(value: Uint8Array | string): void;

  clearKeysList(): void;
  getKeysList(): Array<Uint8Array | string>;
  getKeysList_asU8(): Array<Uint8Array>;
  getKeysList_asB64(): Array<string>;
  setKeysList(value: Array<Uint8Array | string>): void;
  addKeys(value: Uint8Array | string, index?: number): Uint8Array | string;

  getFilter(): Uint8Array | string;
  getFilter_asU8(): Uint8Array;
  getFilter_asB64(): string;
  setFilter(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InvokeAllRequest.AsObject;
  static toObject(includeInstance: boolean, msg: InvokeAllRequest): InvokeAllRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: InvokeAllRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InvokeAllRequest;
  static deserializeBinaryFromReader(message: InvokeAllRequest, reader: jspb.BinaryReader): InvokeAllRequest;
}

export namespace InvokeAllRequest {
  export type AsObject = {
    cache: string,
    format: string,
    processor: Uint8Array | string,
    keysList: Array<Uint8Array | string>,
    filter: Uint8Array | string,
  }
}

export class EntrySetRequest extends jspb.Message {
  getCache(): string;
  setCache(value: string): void;

  getFormat(): string;
  setFormat(value: string): void;

  getFilter(): Uint8Array | string;
  getFilter_asU8(): Uint8Array;
  getFilter_asB64(): string;
  setFilter(value: Uint8Array | string): void;

  getComparator(): Uint8Array | string;
  getComparator_asU8(): Uint8Array;
  getComparator_asB64(): string;
  setComparator(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EntrySetRequest.AsObject;
  static toObject(includeInstance: boolean, msg: EntrySetRequest): EntrySetRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: EntrySetRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EntrySetRequest;
  static deserializeBinaryFromReader(message: EntrySetRequest, reader: jspb.BinaryReader): EntrySetRequest;
}

export namespace EntrySetRequest {
  export type AsObject = {
    cache: string,
    format: string,
    filter: Uint8Array | string,
    comparator: Uint8Array | string,
  }
}

export class KeySetRequest extends jspb.Message {
  getCache(): string;
  setCache(value: string): void;

  getFormat(): string;
  setFormat(value: string): void;

  getFilter(): Uint8Array | string;
  getFilter_asU8(): Uint8Array;
  getFilter_asB64(): string;
  setFilter(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): KeySetRequest.AsObject;
  static toObject(includeInstance: boolean, msg: KeySetRequest): KeySetRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: KeySetRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): KeySetRequest;
  static deserializeBinaryFromReader(message: KeySetRequest, reader: jspb.BinaryReader): KeySetRequest;
}

export namespace KeySetRequest {
  export type AsObject = {
    cache: string,
    format: string,
    filter: Uint8Array | string,
  }
}

export class ValuesRequest extends jspb.Message {
  getCache(): string;
  setCache(value: string): void;

  getFormat(): string;
  setFormat(value: string): void;

  getFilter(): Uint8Array | string;
  getFilter_asU8(): Uint8Array;
  getFilter_asB64(): string;
  setFilter(value: Uint8Array | string): void;

  getComparator(): Uint8Array | string;
  getComparator_asU8(): Uint8Array;
  getComparator_asB64(): string;
  setComparator(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ValuesRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ValuesRequest): ValuesRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ValuesRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ValuesRequest;
  static deserializeBinaryFromReader(message: ValuesRequest, reader: jspb.BinaryReader): ValuesRequest;
}

export namespace ValuesRequest {
  export type AsObject = {
    cache: string,
    format: string,
    filter: Uint8Array | string,
    comparator: Uint8Array | string,
  }
}

export class OptionalValue extends jspb.Message {
  getPresent(): boolean;
  setPresent(value: boolean): void;

  getValue(): Uint8Array | string;
  getValue_asU8(): Uint8Array;
  getValue_asB64(): string;
  setValue(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): OptionalValue.AsObject;
  static toObject(includeInstance: boolean, msg: OptionalValue): OptionalValue.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: OptionalValue, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): OptionalValue;
  static deserializeBinaryFromReader(message: OptionalValue, reader: jspb.BinaryReader): OptionalValue;
}

export namespace OptionalValue {
  export type AsObject = {
    present: boolean,
    value: Uint8Array | string,
  }
}

export class MapListenerRequest extends jspb.Message {
  getCache(): string;
  setCache(value: string): void;

  getFormat(): string;
  setFormat(value: string): void;

  getUid(): string;
  setUid(value: string): void;

  getType(): MapListenerRequest.RequestTypeMap[keyof MapListenerRequest.RequestTypeMap];
  setType(value: MapListenerRequest.RequestTypeMap[keyof MapListenerRequest.RequestTypeMap]): void;

  getFilter(): Uint8Array | string;
  getFilter_asU8(): Uint8Array;
  getFilter_asB64(): string;
  setFilter(value: Uint8Array | string): void;

  getKey(): Uint8Array | string;
  getKey_asU8(): Uint8Array;
  getKey_asB64(): string;
  setKey(value: Uint8Array | string): void;

  getLite(): boolean;
  setLite(value: boolean): void;

  getSubscribe(): boolean;
  setSubscribe(value: boolean): void;

  getPriming(): boolean;
  setPriming(value: boolean): void;

  getTrigger(): Uint8Array | string;
  getTrigger_asU8(): Uint8Array;
  getTrigger_asB64(): string;
  setTrigger(value: Uint8Array | string): void;

  getFilterid(): number;
  setFilterid(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MapListenerRequest.AsObject;
  static toObject(includeInstance: boolean, msg: MapListenerRequest): MapListenerRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MapListenerRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MapListenerRequest;
  static deserializeBinaryFromReader(message: MapListenerRequest, reader: jspb.BinaryReader): MapListenerRequest;
}

export namespace MapListenerRequest {
  export type AsObject = {
    cache: string,
    format: string,
    uid: string,
    type: MapListenerRequest.RequestTypeMap[keyof MapListenerRequest.RequestTypeMap],
    filter: Uint8Array | string,
    key: Uint8Array | string,
    lite: boolean,
    subscribe: boolean,
    priming: boolean,
    trigger: Uint8Array | string,
    filterid: number,
  }

  export interface RequestTypeMap {
    INIT: 0;
    KEY: 1;
    FILTER: 2;
  }

  export const RequestType: RequestTypeMap;
}

export class MapListenerResponse extends jspb.Message {
  hasSubscribed(): boolean;
  clearSubscribed(): void;
  getSubscribed(): MapListenerSubscribedResponse | undefined;
  setSubscribed(value?: MapListenerSubscribedResponse): void;

  hasUnsubscribed(): boolean;
  clearUnsubscribed(): void;
  getUnsubscribed(): MapListenerUnsubscribedResponse | undefined;
  setUnsubscribed(value?: MapListenerUnsubscribedResponse): void;

  hasEvent(): boolean;
  clearEvent(): void;
  getEvent(): MapEventResponse | undefined;
  setEvent(value?: MapEventResponse): void;

  hasError(): boolean;
  clearError(): void;
  getError(): MapListenerErrorResponse | undefined;
  setError(value?: MapListenerErrorResponse): void;

  hasDestroyed(): boolean;
  clearDestroyed(): void;
  getDestroyed(): CacheDestroyedResponse | undefined;
  setDestroyed(value?: CacheDestroyedResponse): void;

  hasTruncated(): boolean;
  clearTruncated(): void;
  getTruncated(): CacheTruncatedResponse | undefined;
  setTruncated(value?: CacheTruncatedResponse): void;

  getResponseTypeCase(): MapListenerResponse.ResponseTypeCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MapListenerResponse.AsObject;
  static toObject(includeInstance: boolean, msg: MapListenerResponse): MapListenerResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MapListenerResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MapListenerResponse;
  static deserializeBinaryFromReader(message: MapListenerResponse, reader: jspb.BinaryReader): MapListenerResponse;
}

export namespace MapListenerResponse {
  export type AsObject = {
    subscribed?: MapListenerSubscribedResponse.AsObject,
    unsubscribed?: MapListenerUnsubscribedResponse.AsObject,
    event?: MapEventResponse.AsObject,
    error?: MapListenerErrorResponse.AsObject,
    destroyed?: CacheDestroyedResponse.AsObject,
    truncated?: CacheTruncatedResponse.AsObject,
  }

  export enum ResponseTypeCase {
    RESPONSE_TYPE_NOT_SET = 0,
    SUBSCRIBED = 1,
    UNSUBSCRIBED = 2,
    EVENT = 3,
    ERROR = 4,
    DESTROYED = 5,
    TRUNCATED = 6,
  }
}

export class MapListenerSubscribedResponse extends jspb.Message {
  getUid(): string;
  setUid(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MapListenerSubscribedResponse.AsObject;
  static toObject(includeInstance: boolean, msg: MapListenerSubscribedResponse): MapListenerSubscribedResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MapListenerSubscribedResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MapListenerSubscribedResponse;
  static deserializeBinaryFromReader(message: MapListenerSubscribedResponse, reader: jspb.BinaryReader): MapListenerSubscribedResponse;
}

export namespace MapListenerSubscribedResponse {
  export type AsObject = {
    uid: string,
  }
}

export class MapListenerUnsubscribedResponse extends jspb.Message {
  getUid(): string;
  setUid(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MapListenerUnsubscribedResponse.AsObject;
  static toObject(includeInstance: boolean, msg: MapListenerUnsubscribedResponse): MapListenerUnsubscribedResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MapListenerUnsubscribedResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MapListenerUnsubscribedResponse;
  static deserializeBinaryFromReader(message: MapListenerUnsubscribedResponse, reader: jspb.BinaryReader): MapListenerUnsubscribedResponse;
}

export namespace MapListenerUnsubscribedResponse {
  export type AsObject = {
    uid: string,
  }
}

export class CacheDestroyedResponse extends jspb.Message {
  getCache(): string;
  setCache(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CacheDestroyedResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CacheDestroyedResponse): CacheDestroyedResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CacheDestroyedResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CacheDestroyedResponse;
  static deserializeBinaryFromReader(message: CacheDestroyedResponse, reader: jspb.BinaryReader): CacheDestroyedResponse;
}

export namespace CacheDestroyedResponse {
  export type AsObject = {
    cache: string,
  }
}

export class CacheTruncatedResponse extends jspb.Message {
  getCache(): string;
  setCache(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CacheTruncatedResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CacheTruncatedResponse): CacheTruncatedResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CacheTruncatedResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CacheTruncatedResponse;
  static deserializeBinaryFromReader(message: CacheTruncatedResponse, reader: jspb.BinaryReader): CacheTruncatedResponse;
}

export namespace CacheTruncatedResponse {
  export type AsObject = {
    cache: string,
  }
}

export class MapListenerErrorResponse extends jspb.Message {
  getUid(): string;
  setUid(value: string): void;

  getMessage(): string;
  setMessage(value: string): void;

  getCode(): number;
  setCode(value: number): void;

  clearStackList(): void;
  getStackList(): Array<string>;
  setStackList(value: Array<string>): void;
  addStack(value: string, index?: number): string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MapListenerErrorResponse.AsObject;
  static toObject(includeInstance: boolean, msg: MapListenerErrorResponse): MapListenerErrorResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MapListenerErrorResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MapListenerErrorResponse;
  static deserializeBinaryFromReader(message: MapListenerErrorResponse, reader: jspb.BinaryReader): MapListenerErrorResponse;
}

export namespace MapListenerErrorResponse {
  export type AsObject = {
    uid: string,
    message: string,
    code: number,
    stackList: Array<string>,
  }
}

export class MapEventResponse extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getKey(): Uint8Array | string;
  getKey_asU8(): Uint8Array;
  getKey_asB64(): string;
  setKey(value: Uint8Array | string): void;

  getNewvalue(): Uint8Array | string;
  getNewvalue_asU8(): Uint8Array;
  getNewvalue_asB64(): string;
  setNewvalue(value: Uint8Array | string): void;

  getOldvalue(): Uint8Array | string;
  getOldvalue_asU8(): Uint8Array;
  getOldvalue_asB64(): string;
  setOldvalue(value: Uint8Array | string): void;

  getTransformationstate(): MapEventResponse.TransformationStateMap[keyof MapEventResponse.TransformationStateMap];
  setTransformationstate(value: MapEventResponse.TransformationStateMap[keyof MapEventResponse.TransformationStateMap]): void;

  clearFilteridsList(): void;
  getFilteridsList(): Array<number>;
  setFilteridsList(value: Array<number>): void;
  addFilterids(value: number, index?: number): number;

  getSynthetic(): boolean;
  setSynthetic(value: boolean): void;

  getPriming(): boolean;
  setPriming(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MapEventResponse.AsObject;
  static toObject(includeInstance: boolean, msg: MapEventResponse): MapEventResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MapEventResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MapEventResponse;
  static deserializeBinaryFromReader(message: MapEventResponse, reader: jspb.BinaryReader): MapEventResponse;
}

export namespace MapEventResponse {
  export type AsObject = {
    id: number,
    key: Uint8Array | string,
    newvalue: Uint8Array | string,
    oldvalue: Uint8Array | string,
    transformationstate: MapEventResponse.TransformationStateMap[keyof MapEventResponse.TransformationStateMap],
    filteridsList: Array<number>,
    synthetic: boolean,
    priming: boolean,
  }

  export interface TransformationStateMap {
    NON_TRANSFORMABLE: 0;
    TRANSFORMABLE: 1;
    TRANSFORMED: 2;
  }

  export const TransformationState: TransformationStateMap;
}

