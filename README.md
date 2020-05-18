<!--
Copyright (c) 2020 Oracle and/or its affiliates.

Licensed under the Universal Permissive License v 1.0 as shown at
http://oss.oracle.com/licenses/upl.
 -->

# Coherence gRPC Javascript Client

Coherence gRPC Javascript Client allows Node applications to act as
cache clients to a Coherence Cluster using the ubiquitous gRPC framework as
the network transport.

In addition to supporting most Coherence cache operations, this client provides
support for cache events allowing developers to add listeners based on a single key
or based on a filtered set of keys and/or values.

## Usage

To use the Coherence gRPC Javascript Client, simply declare it as a dependency in your
project's `project.json`:
```json
TODO
```

## Examples
### Cache Access
These examples assume a Coherence cluster is already running with gRPC support enabled (TODO reference
to those docs once they are available).

First, establish a session with the Coherence cluster:
```typescript
let session = new SessionBuilder().build();
```

This assumes a default of `localhost` and `1409` for the host and port the gRPC server proxy
bound to.

To use values other than the default:

```typescript
let session = new SessionBuilder().withAddress('<host>:<port>').build();
```

Once a session has been established, it is possible to start accessing caches.

```typescript
let cache = session.getCache('<cache-name>')
cache.put("key", "value");
cache.get("key")  // value
```

See the documentation (TODO - add link once docs are ready) for more details on what operations
can be performed against a cache.

### Events


## Build

1. You need to install:
    - The `protoc` compiler
    - Node 14.2.0 or later


2. Checkout the `coherence-js` workspace and run `npm install`
   - git clone https://gitlab-odx.oracledx.com/coherence/coherence-js.git
   - npm install

4. Then run: `npm test`
