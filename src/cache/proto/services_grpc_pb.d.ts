// GENERATED CODE -- DO NOT EDIT!

// package: coherence
// file: services.proto

import * as services_pb from "./services_pb";
import * as messages_pb from "./messages_pb";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as google_protobuf_wrappers_pb from "google-protobuf/google/protobuf/wrappers_pb";
import * as grpc from "grpc";

interface INamedCacheServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
  addIndex: grpc.MethodDefinition<messages_pb.AddIndexRequest, google_protobuf_empty_pb.Empty>;
  aggregate: grpc.MethodDefinition<messages_pb.AggregateRequest, google_protobuf_wrappers_pb.BytesValue>;
  clear: grpc.MethodDefinition<messages_pb.ClearRequest, google_protobuf_empty_pb.Empty>;
  containsEntry: grpc.MethodDefinition<messages_pb.ContainsEntryRequest, google_protobuf_wrappers_pb.BoolValue>;
  containsKey: grpc.MethodDefinition<messages_pb.ContainsKeyRequest, google_protobuf_wrappers_pb.BoolValue>;
  containsValue: grpc.MethodDefinition<messages_pb.ContainsValueRequest, google_protobuf_wrappers_pb.BoolValue>;
  destroy: grpc.MethodDefinition<messages_pb.DestroyRequest, google_protobuf_empty_pb.Empty>;
  entrySet: grpc.MethodDefinition<messages_pb.EntrySetRequest, messages_pb.Entry>;
  events: grpc.MethodDefinition<messages_pb.MapListenerRequest, messages_pb.MapListenerResponse>;
  get: grpc.MethodDefinition<messages_pb.GetRequest, messages_pb.OptionalValue>;
  getAll: grpc.MethodDefinition<messages_pb.GetAllRequest, messages_pb.Entry>;
  invoke: grpc.MethodDefinition<messages_pb.InvokeRequest, google_protobuf_wrappers_pb.BytesValue>;
  invokeAll: grpc.MethodDefinition<messages_pb.InvokeAllRequest, messages_pb.Entry>;
  isEmpty: grpc.MethodDefinition<messages_pb.IsEmptyRequest, google_protobuf_wrappers_pb.BoolValue>;
  keySet: grpc.MethodDefinition<messages_pb.KeySetRequest, google_protobuf_wrappers_pb.BytesValue>;
  nextEntrySetPage: grpc.MethodDefinition<messages_pb.PageRequest, messages_pb.EntryResult>;
  nextKeySetPage: grpc.MethodDefinition<messages_pb.PageRequest, google_protobuf_wrappers_pb.BytesValue>;
  put: grpc.MethodDefinition<messages_pb.PutRequest, google_protobuf_wrappers_pb.BytesValue>;
  putAll: grpc.MethodDefinition<messages_pb.PutAllRequest, google_protobuf_empty_pb.Empty>;
  putIfAbsent: grpc.MethodDefinition<messages_pb.PutIfAbsentRequest, google_protobuf_wrappers_pb.BytesValue>;
  remove: grpc.MethodDefinition<messages_pb.RemoveRequest, google_protobuf_wrappers_pb.BytesValue>;
  removeMapping: grpc.MethodDefinition<messages_pb.RemoveMappingRequest, google_protobuf_wrappers_pb.BoolValue>;
  replace: grpc.MethodDefinition<messages_pb.ReplaceRequest, google_protobuf_wrappers_pb.BytesValue>;
  replaceMapping: grpc.MethodDefinition<messages_pb.ReplaceMappingRequest, google_protobuf_wrappers_pb.BoolValue>;
  size: grpc.MethodDefinition<messages_pb.SizeRequest, google_protobuf_wrappers_pb.Int32Value>;
  truncate: grpc.MethodDefinition<messages_pb.SizeRequest, google_protobuf_wrappers_pb.Int32Value>;
  values: grpc.MethodDefinition<messages_pb.ValuesRequest, google_protobuf_wrappers_pb.BytesValue>;
}

export const NamedCacheServiceService: INamedCacheServiceService;

export class NamedCacheServiceClient extends grpc.Client {
  constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
  addIndex(argument: messages_pb.AddIndexRequest, callback: grpc.requestCallback<google_protobuf_empty_pb.Empty>): grpc.ClientUnaryCall;
  addIndex(argument: messages_pb.AddIndexRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_empty_pb.Empty>): grpc.ClientUnaryCall;
  addIndex(argument: messages_pb.AddIndexRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_empty_pb.Empty>): grpc.ClientUnaryCall;
  aggregate(argument: messages_pb.AggregateRequest, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BytesValue>): grpc.ClientUnaryCall;
  aggregate(argument: messages_pb.AggregateRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BytesValue>): grpc.ClientUnaryCall;
  aggregate(argument: messages_pb.AggregateRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BytesValue>): grpc.ClientUnaryCall;
  clear(argument: messages_pb.ClearRequest, callback: grpc.requestCallback<google_protobuf_empty_pb.Empty>): grpc.ClientUnaryCall;
  clear(argument: messages_pb.ClearRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_empty_pb.Empty>): grpc.ClientUnaryCall;
  clear(argument: messages_pb.ClearRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_empty_pb.Empty>): grpc.ClientUnaryCall;
  containsEntry(argument: messages_pb.ContainsEntryRequest, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BoolValue>): grpc.ClientUnaryCall;
  containsEntry(argument: messages_pb.ContainsEntryRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BoolValue>): grpc.ClientUnaryCall;
  containsEntry(argument: messages_pb.ContainsEntryRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BoolValue>): grpc.ClientUnaryCall;
  containsKey(argument: messages_pb.ContainsKeyRequest, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BoolValue>): grpc.ClientUnaryCall;
  containsKey(argument: messages_pb.ContainsKeyRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BoolValue>): grpc.ClientUnaryCall;
  containsKey(argument: messages_pb.ContainsKeyRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BoolValue>): grpc.ClientUnaryCall;
  containsValue(argument: messages_pb.ContainsValueRequest, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BoolValue>): grpc.ClientUnaryCall;
  containsValue(argument: messages_pb.ContainsValueRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BoolValue>): grpc.ClientUnaryCall;
  containsValue(argument: messages_pb.ContainsValueRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BoolValue>): grpc.ClientUnaryCall;
  destroy(argument: messages_pb.DestroyRequest, callback: grpc.requestCallback<google_protobuf_empty_pb.Empty>): grpc.ClientUnaryCall;
  destroy(argument: messages_pb.DestroyRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_empty_pb.Empty>): grpc.ClientUnaryCall;
  destroy(argument: messages_pb.DestroyRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_empty_pb.Empty>): grpc.ClientUnaryCall;
  entrySet(argument: messages_pb.EntrySetRequest, metadataOrOptions?: grpc.Metadata | grpc.CallOptions | null): grpc.ClientReadableStream<messages_pb.Entry>;
  entrySet(argument: messages_pb.EntrySetRequest, metadata?: grpc.Metadata | null, options?: grpc.CallOptions | null): grpc.ClientReadableStream<messages_pb.Entry>;
  events(metadataOrOptions?: grpc.Metadata | grpc.CallOptions | null): grpc.ClientDuplexStream<messages_pb.MapListenerRequest, messages_pb.MapListenerResponse>;
  events(metadata?: grpc.Metadata | null, options?: grpc.CallOptions | null): grpc.ClientDuplexStream<messages_pb.MapListenerRequest, messages_pb.MapListenerResponse>;
  get(argument: messages_pb.GetRequest, callback: grpc.requestCallback<messages_pb.OptionalValue>): grpc.ClientUnaryCall;
  get(argument: messages_pb.GetRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<messages_pb.OptionalValue>): grpc.ClientUnaryCall;
  get(argument: messages_pb.GetRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<messages_pb.OptionalValue>): grpc.ClientUnaryCall;
  getAll(argument: messages_pb.GetAllRequest, metadataOrOptions?: grpc.Metadata | grpc.CallOptions | null): grpc.ClientReadableStream<messages_pb.Entry>;
  getAll(argument: messages_pb.GetAllRequest, metadata?: grpc.Metadata | null, options?: grpc.CallOptions | null): grpc.ClientReadableStream<messages_pb.Entry>;
  invoke(argument: messages_pb.InvokeRequest, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BytesValue>): grpc.ClientUnaryCall;
  invoke(argument: messages_pb.InvokeRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BytesValue>): grpc.ClientUnaryCall;
  invoke(argument: messages_pb.InvokeRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BytesValue>): grpc.ClientUnaryCall;
  invokeAll(argument: messages_pb.InvokeAllRequest, metadataOrOptions?: grpc.Metadata | grpc.CallOptions | null): grpc.ClientReadableStream<messages_pb.Entry>;
  invokeAll(argument: messages_pb.InvokeAllRequest, metadata?: grpc.Metadata | null, options?: grpc.CallOptions | null): grpc.ClientReadableStream<messages_pb.Entry>;
  isEmpty(argument: messages_pb.IsEmptyRequest, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BoolValue>): grpc.ClientUnaryCall;
  isEmpty(argument: messages_pb.IsEmptyRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BoolValue>): grpc.ClientUnaryCall;
  isEmpty(argument: messages_pb.IsEmptyRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BoolValue>): grpc.ClientUnaryCall;
  keySet(argument: messages_pb.KeySetRequest, metadataOrOptions?: grpc.Metadata | grpc.CallOptions | null): grpc.ClientReadableStream<google_protobuf_wrappers_pb.BytesValue>;
  keySet(argument: messages_pb.KeySetRequest, metadata?: grpc.Metadata | null, options?: grpc.CallOptions | null): grpc.ClientReadableStream<google_protobuf_wrappers_pb.BytesValue>;
  nextEntrySetPage(argument: messages_pb.PageRequest, metadataOrOptions?: grpc.Metadata | grpc.CallOptions | null): grpc.ClientReadableStream<messages_pb.EntryResult>;
  nextEntrySetPage(argument: messages_pb.PageRequest, metadata?: grpc.Metadata | null, options?: grpc.CallOptions | null): grpc.ClientReadableStream<messages_pb.EntryResult>;
  nextKeySetPage(argument: messages_pb.PageRequest, metadataOrOptions?: grpc.Metadata | grpc.CallOptions | null): grpc.ClientReadableStream<google_protobuf_wrappers_pb.BytesValue>;
  nextKeySetPage(argument: messages_pb.PageRequest, metadata?: grpc.Metadata | null, options?: grpc.CallOptions | null): grpc.ClientReadableStream<google_protobuf_wrappers_pb.BytesValue>;
  put(argument: messages_pb.PutRequest, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BytesValue>): grpc.ClientUnaryCall;
  put(argument: messages_pb.PutRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BytesValue>): grpc.ClientUnaryCall;
  put(argument: messages_pb.PutRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BytesValue>): grpc.ClientUnaryCall;
  putAll(argument: messages_pb.PutAllRequest, callback: grpc.requestCallback<google_protobuf_empty_pb.Empty>): grpc.ClientUnaryCall;
  putAll(argument: messages_pb.PutAllRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_empty_pb.Empty>): grpc.ClientUnaryCall;
  putAll(argument: messages_pb.PutAllRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_empty_pb.Empty>): grpc.ClientUnaryCall;
  putIfAbsent(argument: messages_pb.PutIfAbsentRequest, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BytesValue>): grpc.ClientUnaryCall;
  putIfAbsent(argument: messages_pb.PutIfAbsentRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BytesValue>): grpc.ClientUnaryCall;
  putIfAbsent(argument: messages_pb.PutIfAbsentRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BytesValue>): grpc.ClientUnaryCall;
  remove(argument: messages_pb.RemoveRequest, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BytesValue>): grpc.ClientUnaryCall;
  remove(argument: messages_pb.RemoveRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BytesValue>): grpc.ClientUnaryCall;
  remove(argument: messages_pb.RemoveRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BytesValue>): grpc.ClientUnaryCall;
  removeMapping(argument: messages_pb.RemoveMappingRequest, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BoolValue>): grpc.ClientUnaryCall;
  removeMapping(argument: messages_pb.RemoveMappingRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BoolValue>): grpc.ClientUnaryCall;
  removeMapping(argument: messages_pb.RemoveMappingRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BoolValue>): grpc.ClientUnaryCall;
  replace(argument: messages_pb.ReplaceRequest, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BytesValue>): grpc.ClientUnaryCall;
  replace(argument: messages_pb.ReplaceRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BytesValue>): grpc.ClientUnaryCall;
  replace(argument: messages_pb.ReplaceRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BytesValue>): grpc.ClientUnaryCall;
  replaceMapping(argument: messages_pb.ReplaceMappingRequest, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BoolValue>): grpc.ClientUnaryCall;
  replaceMapping(argument: messages_pb.ReplaceMappingRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BoolValue>): grpc.ClientUnaryCall;
  replaceMapping(argument: messages_pb.ReplaceMappingRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_wrappers_pb.BoolValue>): grpc.ClientUnaryCall;
  size(argument: messages_pb.SizeRequest, callback: grpc.requestCallback<google_protobuf_wrappers_pb.Int32Value>): grpc.ClientUnaryCall;
  size(argument: messages_pb.SizeRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_wrappers_pb.Int32Value>): grpc.ClientUnaryCall;
  size(argument: messages_pb.SizeRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_wrappers_pb.Int32Value>): grpc.ClientUnaryCall;
  truncate(argument: messages_pb.SizeRequest, callback: grpc.requestCallback<google_protobuf_wrappers_pb.Int32Value>): grpc.ClientUnaryCall;
  truncate(argument: messages_pb.SizeRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_wrappers_pb.Int32Value>): grpc.ClientUnaryCall;
  truncate(argument: messages_pb.SizeRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_wrappers_pb.Int32Value>): grpc.ClientUnaryCall;
  values(argument: messages_pb.ValuesRequest, metadataOrOptions?: grpc.Metadata | grpc.CallOptions | null): grpc.ClientReadableStream<google_protobuf_wrappers_pb.BytesValue>;
  values(argument: messages_pb.ValuesRequest, metadata?: grpc.Metadata | null, options?: grpc.CallOptions | null): grpc.ClientReadableStream<google_protobuf_wrappers_pb.BytesValue>;
}
