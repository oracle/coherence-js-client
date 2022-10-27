<!--
Copyright (c) 2020, 2022 Oracle and/or its affiliates.

Licensed under the Universal Permissive License v 1.0 as shown at
http://oss.oracle.com/licenses/upl.
 -->

# Coherence JavaScript Client

Coherence JavaScript Client allows Node applications to act as
cache clients to a Coherence Cluster using Google's gRPC framework for
the network transport.

### Features
* Familiar `Map`-like interface for manipulating entries
* Cluster-side querying and aggregation of map entries
* Cluster-side manipulation of map entries using `EntryProcessors`
* Registration of listeners to be notified of map mutations

### Requirements
* Coherence CE 22.06 or later (or equivalent non-open source editions) with a configured [gRPC Proxy](https://docs.oracle.com/en/middleware/standalone/coherence/14.1.1.2206/develop-remote-clients/using-coherence-grpc-server.html)
* Node 14
* NPM 8.x

### Usage

Before testing the library, you must ensure a Coherence cluster is available.  For local development, we recommend using the Coherence CE Docker image; it contains everything necessary for the client to operate correctly.

```bash
docker run -d -p 1408:1408 ghcr.io/oracle/coherence-ce:22.06.2
```

For more details on the image, see the [documentation](https://github.com/oracle/coherence/tree/master/prj/coherence-docker).

### Declare Your Dependency

To use the Coherence gRPC JavaScript Client, simply declare it as a dependency in your
project's `package.json`:
```
...
"dependencies": {
    "@oracle/coherence": "^1.1",
},
...
```

### Examples

> NOTE: The following examples assume the Coherence container is running locally.
> You can start a container by running `npm run coh-up`.

#### Establishing a Session

The Coherence uses the concept of a `Session` to manage a set of related Coherence resources,
such as maps and/or caches. When using the Coherence JavaScript Client, a `Session` connects to a specific
gRPC endpoint and uses a specific serialization format to marshal requests and responses.
This means that different sessions using different serializers may connect to the same server endpoint. Typically,
for efficiency the client and server would be configured to use matching serialization formats to avoid
deserialization of data on the server, but this does not have to be the case. If the server is using a different
serializer for the server-side caches, it must be able to deserialize the client's requests, so there must be
a serializer configured on the server to match that used by the client.

> NOTE: Currently, the Coherence JavaScript client only supports JSON serialization

A `Session` is constructed using an `Options` instance, or a generic object with the same keys and values.

The currently supported properties are:
* `address` - the address of the Coherence gRPC proxy.  This defaults to `localhost:1408`.
* `requestTimeoutInMillis` - the gRPC request timeout in milliseconds.  This defaults to `60000`.
* `callOptions` - per-request gRPC call options.
* `tls` - options related to the configuration of TLS.
    - `enabled` - determines if TLS is enabled or not.  This defaults to `false`.
    - `caCertPath` - the path to the CA certificate.
    - `clientCertPath` - the path to the client certificate.
    - `clientKeyPath` - the path to the client certificate key.

```typescript
const { Session } = require('@oracle/coherence')

let session = new Session()
```

This is the simplest invocation which assumes the following defaults:
* `address` is `localhost:1408`
* `requestTimeoutInMillis` is `60000`
* `tls` is `disabled`

To use values other than the default, create a new `Options` instance, configure as desired,
and pass it to the constructor of the `Session`:

```javascript
const { Session, Options } = require('@oracle/coherence')

const opts = new Options()
opts.address = 'example.com:4444'

let session = new Session(opts)
```

or instead of an `Options` instance, using a generic JavaScript object:

```javascript
const { Session } = require('@oracle/coherence')

const opts = new Options({address: 'example.com:4444'})

let session = new Session(opts)
```

It's also possible to control the default address the session will bind to by providing
an address via the `grpc_proxy_address` environment variable.  The format of the value would
be the same as if you configured it programmatically as the above example shows.

Once the session has been constructed, it will now be possible to create maps and caches.

#### Basic Map Operations

The map (`NamedMap`) and cache (`NamedCache`) implementations provide the same basic features as the Map provided
by JavaScript except for the following differences:

* key equality isn't restricted to reference equality
* insertion order is not maintained
* `set()` calls cannot be chained because of the asynchronous nature of the API

> NOTE: The only difference between `NamedCache` and `NamedMap` is that the 'NamedCache' allows associating a
> `time-to-live` on the cache entry, while `NamedMap` does not

For the following examples, let's assume that we have a Map defined in Coherence named `Test`.
To get access to the map from the client:

> NOTE: If using the Docker image previously mentioned for testing, you don't need to worry about the details of the map name.  Any name will work.

```javascript
let map = session.getMap('Test')
```

Once we have a handle to our map, we can invoke the same basic operations as a standard JavaScript Map:
```javascript
await map.size
// (zero)

await map.set('key1', 'value1')
await map.set('key2', 'value2')
// returns a Promise vs the map itself, so these can't be chained

await map.size
// (two)

await map.get('key1')
// value1

await map.has('key2')
// true

await map.has('key3')
// false

await map.keys()
// ['key1', 'key2']

await map.values()
// ['value1', 'value2']

await map.entries()
// [{key: 'key1', value: 'value1'}, {key: 'key2', value: 'value2'}]

await map.forEach((value, key) => console.log(key + ': ' + value))
// prints all of the entries
```

#### Querying the Map

Coherence provides a rich set of primitives that allow developers to create advanced queries against
a set of entries returning only those keys and/or values matching the specified criteria.
See the [documentation](https://oracle.github.io/coherence/22.06/api/java/index.html) for details
on the Filters provided by this client.

Let's assume we have a `NamedMap` in which we're storing `string` keys and some objects with the structure of:

```
{
  name: <string>
  age:  <number>
  hobbies: [] // of string
}
```

First, let's insert a few objects:

```javascript
await map.set('0001', {name: "Bill Smith", age: 38, hobbies: ["gardening", "painting"]})
await map.set('0002', {name: "Fred Jones", age: 56, hobbies: ["racing", "golf"]})
await map.set('0003', {name: "Jane Doe", age: 48, hobbies: ["gardening", "photography"]})
```

Using a filter, we can limit the result set returned by the map:

```javascript
const { Filters } = require('@oracle/coherence')

// ...

await map.entries(Filters.greater('age', 40))
// [{key: '0002', value: {name: "Fred Jones"...}}, {key: '0002', value: {name: "Jane Doe"...}}]

await map.keys(Filters.arrayContains('hobbies', 'gardening'))  
// ['0001', '0003']

await map.values(Filters.not(Filters.arrayContains('hobbies', 'gardening')))
// [{name: "Fred Jones", age: 56, hobbies: ["racing", "golf"]}]
```

#### Aggregation

Coherence provides developers with the ability to process some subset of the entries in a map,
resulting in an aggregated result. See the [documentation](https://oracle.github.io/coherence/22.06/api/java/index.html) for aggregators provided by this client.

Assume the same set of keys and values are present from the filtering example above:

```javascript
const { Aggregators, Filters } = require('@oracle/coherence')

// ...

await map.aggregate(Aggregators.average('age'))
// 47.3

await map.aggregate(Aggregators.sum('age'))
// 142

await map.aggregate(Filters.greater('age', 40), Aggregators.count())
// 2
```

#### Entry Processing

An entry processor allows mutation of map entries in-place within the cluster instead of bringing the entire object
to the client, updating, and pushing the value back.  See the [documentation](https://oracle.github.io/coherence/22.06/api/java/index.html) for the processors provided by this client.

Assume the same set of keys and values are present from the filtering and aggregation examples:

```javascript
const { Filters, Processors } = require('@oracle/coherence')

// ...

// targeting a specific entry
await map.invoke('0001', Processors.extract('age'))
// returns: 38

// target all entries across the cluster
await map.invokeAll(Processors.extract('age'))
// returns: [['0001', 38], ['0002', 56], ['0003', 48]]

// target all entries matching filtered critera
await map.invokeAll(Filters.greater('age', 40), Processors.extract('age'))
// returns: [['0002', 56], ['0003', 48]]

// incrementing a number 'in-place'
await map.invokeAll(Filters.greater('age', 40), Processors.increment('age', 1))
// returns [['0002', 57], ['0003', 49]]

// update a value 'in-place'
await map.invoke('0001', Processors.update('age', 100))
// returns true meaning the value was updated
await map.get('0001')
// the value will reflect the new age value
```

### Events

Coherence provides the ability to subscribe to notifications pertaining to a particular map/cache.
Registration works similarly to event registration with Node, with some key differences.  In addition
to listening for specific events, it is possible to listen to events for changes made to a specific key, or using
a Filter, it's possible to limit the events raised to be for a subset of the map entries.

Now, let's register a listener:

```javascript
import { event } from '@oracle/coherence'

const MapEventType = event.MapEventType
const MapListener = event.MapListener

const handler = (event: MapEvent) => { 
  console.log('Event: ' + event.description 
    + ', Key: ' + JSON.stringify(event.key) 
    + ', New Value: ' + JSON.stringify(event.newValue)
    + ', Old Value: ' + JSON.stringify(event.oldValue))
}

const listener = new MapListener()
  .on(MapEventType.INSERT, handler)
  .on(MapEventType.UPDATE, handler)
  .on(MapEventType.DELETE, handler)

// register to receive all event types for all entries within the map
await map.addMapListener(listener)

await map.set('a', 'b')
// Event: insert, Key: a, New Value: b, Old Value: null

await map.set('a', 'c')
// Event: update, Key: a, New Value: c, Old Value: b

await map.delete('a')
// Event: delete, Key: a, New Value: null, Old Value: c

// remove the listeners
await map.removeMapListener(listener)

// =======================================

// Assume the previous listener as well as the following key and values
//   ['0001', {name: "Bill Smith", age: 38, hobbies: ["gardening", "painting"]}]
//   ['0002', {name: "Fred Jones", age: 56, hobbies: ["racing", "golf"]}]
//   ['0003', {name: "Jane Doe", age: 48, hobbies: ["gardening", "photography"]}]

// Add handlers for updates to '0001'
await map.addMapListener(listener, '0001')

await map.update('0002', '0002')
// does not generate any events

await map.invoke('0001', Processors.increment('age', 1))
// Event: update, Key: 0001, New Value: {name: "Bill Smith", age: 39, hobbies: ["gardening", "painting"]}, Old Value: {name: "Bill Smith", age: 38, hobbies: ["gardening", "painting"]}

await map.delete('0001') 
// does not generate any events

// remove the key listener
await map.removeMapListener(listener, '0001')

// =======================================

// Assume the same setup as the previous example, except instead of listening to events for a single key,
// we'll instead listen for events raised for entries that match the filtered criteria.
const filter = Filters.event(Filters.greater('age', 40), filter.MapEventFilter.UPDATED)

// Listen to all updates to entries where the age property of the entry value is greater than 40
await map.addMapListener(listener, filter) 

await map.invokeAll(Processors.increment('age', 1));
// Event: update, Key: 0002, New Value: {name: "Fred Jones", age: 57, hobbies: ["racing", "golf"]}, Old Value: {name: "Fred Jones", age: 56, hobbies: ["racing", "golf"]}
// Event: update, Key: 0003, New Value: "Jane Doe", age: 49, hobbies: ["gardening", "photography"]}, Old Value: "Jane Doe", age: 48, hobbies: ["gardening", "photography"]}

// remove the filter listener
await map.removeMapListener(listener, filter)
```

### Cut/Paste Example
Here's an example that can be pasted into a new node project that is using this library:

```javascript
const { Session } = require('@oracle/coherence')

let session = new Session()
let map = session.getMap('Test')

setImmediate(async () => {
  console.log("Map size is " + (await map.size))

  console.log("Inserting entry (key=1, value=One)")
  await map.set(1, "One")

  console.log("Inserting entry (key=2, value=Two)")
  await map.set(2, "Two")

  let entries = await map.entries();

  console.log("All entries")
  for await (const entry of entries) {
    console.log(entry.key + '=' + entry.value)
  }

  console.log("Key 1 is " + (await map.get(1)))
  console.log("Key 2 is " + (await map.get(2)))

  console.log("Deleting entry (key=1)")
  await map.delete(1)

  console.log("Map size is " + (await map.size))
  await session.close()
})
```

When run, it produces:

```bash
Map size is 0
Inserting entry (key=1, value=One)
Map entry is One
Deleting entry (key=1)
Map size is 0
```

### References
* Oracle Coherence JavaScript Client - https://coherence.community/20.06/api/js/index.html
* Oracle Coherence CE Documentation - https://coherence.community/22.06/docs/#/docs/about/01_overview
