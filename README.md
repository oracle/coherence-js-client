<!--
Copyright (c) 2020 Oracle and/or its affiliates.

Licensed under the Universal Permissive License v 1.0 as shown at
http://oss.oracle.com/licenses/upl.
 -->

# Coherence JavaScript Client

Coherence JavaScript Client allows Node applications to act as
cache clients to a Coherence Cluster using `gRPC` framework as
the network transport.

### Features
* Familar map-like interface for manipulating entries
* Cluster-side querying and aggregation of map entries
* Cluster-side manipulation of cache entries using `EntryProcessors`
* Registration of listeners to be notified of map mutations

### Requirements
* Coherence CE 20.12 or later (or equivalent non-open source editions) with a configured [gRPC Proxy](https://github.com/oracle/coherence/tree/master/prj/coherence-grpc-proxy)
* Node 14
* NPM 6.x

### Usage

Before testing the library, you must ensure a Coherence cluster is availble.  For local development, we recommend using the Coherence CE Docker image; it contains everything necessary for the client to operate correctly.

```bash
docker run -d -p 1408:1408 oraclecoherence/coherence-ce:20.06
```

For more details on the image, see [here](https://github.com/oracle/coherence/tree/master/prj/coherence-docker).

### Declare Your Dependency

To use the Coherence gRPC Javascript Client, simply declare it as a dependency in your
project's `project.json`:
```json
...
"dependencies": {
    "@oracle/coherence": "^1.0.0",
  },
...
```

### Examples

> NOTE: The following examples assume the Coherence container is running locally

#### Establishing a Session

The Coherence uses the concept of a `Session` to manage a set of related Coherence resources, such as maps and/or caches. When using the Coherence JavaScript Client, a `Session` connects to a specific `gRPC` endpoint and uses a specific serialization format to marshal requests and responses. This means that different sessions using different serializers may connect to the same server endpoint. Typically, for efficiency the client and server would be configured to use matching serialization formats to avoid deserialization of data on the server but this does not have to be the case. If the server is using a different serializer for the server side caches it must be able
to deserialize the client's requests, so there must be a serializer configured on the server to match that used by the client.

> NOTE: Currently, the Coherence JavaScript client only supports `JSON` serialization

A `Session` is constructed using a `SessionBuilder`.  The builder exposes configuration such as:
* Address of the Coherence `gRPC` proxy (defaults to `localhost:1408`)
* TLS configuration
* Serialization format
* Request timeout

```typescript
const { SessionBuilder } = require('@oracle/coherence')

let session = new SessionBuilder().build()
```

This is the simplest invocation which assumes the following defaults:
* `address` is `localhost:1408`
* tls is `disabled`
* `format` is `json`

To use values other than the default, invoke the appropriate builder function
to update the configuration:

```javascript
const { SessionBuilder } = require('@oracle/coherence')

let session = new SessionBuilder().withAddress('example.com:4444').build();
```

Once the session has been constructed, it will now be possible to create maps and caches.

#### Basic Map Operations

The map (`NamedMap`) and cache (`NamedCache`) implementations provide the same basic features as the Map defined provided by Javascript except for the following differences:

* key equality isn't restricted to reference equality
* insertion order is not maintained

> NOTE:  The only difference between `NamedCache` and `NamedMap` is that the cache allows associating a time-to-live on the cache entry, while the map does not

For the following examples, let's assume that we have a cache defined with Coherence named 'Test'.  To get access to the cache from the client:

> NOTE: If using the Docker image previously mentioned for testing, you don't need to worry about the details of the cache name.  Any name will work.

```javascript
let map = session.getMap('Test')
```

Once we have the handle to our map, we can invoke all of the same basic operations as a standard JavaScript Map:

```javascript
map.size                                        
// (zero)

map.set('key1', 'value1').set('key2', 'value2') 
// returns the map

map.size                                        
// (two)

map.get('key1')                                 
// value1

map.has('key2')                                 
// true

map.has('key3')                                 
// false

map.keys()                                      
// ['key1', 'key2']

map.values()                                    
// ['value1', 'value2']

map.entries()                                   
// [['key1', 'value1`], ['key2', 'value2`]]

map.forEach(entry => console.log(entry))        
// prints all of the entries
```

#### Querying the Map

Coherence provides a rich set of primitives that allow developers to create advanced queries against
a set of entries returning only those keys and/or values matching the filtered critera.  See the documentation for details on the Filters provided by this client.

Let's assume we have a `NamedMap` in which we're storing `string` keys and some objects with the structure of:

```json
{
  name: string
  age:  number
  hobbies: [] // of string
}
```

Insert a few objects ...

```javascript
map.set('0001', '{name: "Bill Smith", age: 38, hobbies: ["gardening", "painting"]}')
map.set('0002', '{name: "Fred Jones", age: 56, hobbies: ["racing", "golf"]}')
map.set('0003', '{name: "Jane Doe", age: 48, hobbies: ["gardening", "photography"]}')
```

Using a filter we can limit the result set returned by the map:

```javascript
const { Filters } = require('@oracle/coherence')

...

map.entries(Filters.greater('age', 40))                  
// [['0002', {name: "Fred Jones"...}], ['0003', {name: "Jane Doe"...}]]

map.keys(Filters.arrayContains('hobbies', 'gardening'))  
// ['0001', '0003']

map.values(Filters.not(Filters.arrayContains('hobbies', 'gargending')
// [{name: "Fred Jones", age: 56, hobbies: ["racing", "golf"]}]
```

#### Aggregation

Coherence provides developers with the ability to process some subset of the entries in an cache, 
resulting in a aggregated result. See the documentation for aggregators provided by this client.

Assuming the same set of keys and values are present from the filtering example:

```javascript
const { Aggregators, Filters } = require('@oracle/coherence')

...

map.aggregate(Aggregators.average('age'))
// 47.3

map.aggregate(Aggregators.sum('age'))
// 142

map.aggregate(Filters.greater('age', 40), Aggregators.count()) 
// 2
```

#### Entry Processing

An entry processor allows manipulation of cache entries locally within the cluster instead of bringing the entire object to the client, updating, and pushing the value back.  See the documentation for the processors provided by this client.

Assuming the same set of keeys and values are present from the filtering and aggregation examples:

```javascript
const { Filters, Processors } = require('@oracle/coherence')

...

// targeting a specific entry
map.invoke('0001', Processors.extract('age'))
// returns: 38

// target all entries across the cluster
map.invokeAll(Processors.extract('age'))
// returns: [38, 56, 48]

// target all entries matching filtered critera
map.invoke(Filters.greater('age', 40), Processors.extract('age'))
// returns: [56, 48]

// updating a value 'in-place'
map.invoke(Filters.greater('age', 40), Processors.increment('age', 1))
// returns [57, 49]
```


### Events

Coherence provides the ability to subscribe to notifications pertaining to a particular map/cache.

A listener implementation must define one or more of the following callbacks:

```javascript
const { event } = require('@oracle/coherence')

// The MapListenerAdapter allows the developer to create a listener 
// overridding only what is needed, but for the sake of the example, we
// override everything
class MyListener extends event.MapListenerAdapter { 
    entryDeleted(event) {
      console.log('DELETE ' + event.getKey())
    }
    entryInserted(event) {
      console.log('INSERT ' + event.getKey())
    }
    entryUpdated(event) {
      console.log('UPDATE ' + event.getKey())
    }
}
```

Now, let's register the listener:

```javascript
const listener = new MyListener()
map.addListener(listener)          // subscribe to all events for all entries

map.set('a', 'b')
// INSERT 'a'

map.set('a', 'c')
// UPDATE 'c'

map.delete('a')
// DELETE 'a'

map.removeListener(listener)

// =======================================

// assume previous example key/values
map.addListener('0001', listener)  // subscribes to all events for that key only
map.delete('0002')                 // does not generate any events

map.invoke('0001', Processors.increment('age', 1))
// UPDATE '0001'

map.removeListener('0001', listener)

// =======================================

// assume previous example key/values
const filter = Filters.event(Filters.greater('age', 40))
map.addListener(filter, listener) // subscribe to all events for entries where age is greater than 40

map.invokeAll(Processors.increment('age', 1));
// UPDATE '0002'
// UPDATE '0003'
```

### References
* Oracle Coherence Javascript Client - PENDING
* Oracle Coherence CE Documentation - https://coherence.community/20.12/docs/#/docs/about/01_overview