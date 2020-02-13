# Readme

## How to build

1. You need to install:

   1. protoc compiler for your platform. On mac use `brew install protoc`
   2. node v12.13.0

2. Checkout the `coherence-js` workspace and run `npm install`

   1. Make sure you have the proxy setup properly (check in ~/.npmrc)
   2. git clone https://gitlab-odx.oracledx.com/coherence/coherence-js.git
   3. npm install

3. Generate proto source files:

   1. Make sure you have messages.proto and services.proto in `ext/proto` directory. This is yet to
      be automated. We can use `curl` or `wget` to get these files from:
      https://gitlab-odx.oracledx.com/coherence/coherence-grpc-proxy/tree/master/coherence-grpc-client/src/main/proto
   2. Then run: setup.sh (This will generate .ts and .js files from .proto files)

4. Then run: `npm test`

## Project structure

Note that TypeScript compiler doesn't allow circular imports
(A imports B; B import C; and C imports A is disallowed)

- ext/proto -> contains .proto files (from grpc-proxy project)
- package.json
- tsconfig.json
- src/
  _ cache/
  _ filter/
  _ filters.ts
  _ extractor/
  _ processor/
  _ util/
  _ serializer.ts
  _ map_listener.ts

target/

## What has not been done:

    [ ] Documentation: I am leaning towards TSDoc.
    	https://github.com/microsoft/tsdoc

    	TSDoc is a proposal to standardize the doc comments
    	used in TypeScript source files. It allows different
    	tools to extract content from comments without getting
    	confused by each other's syntax.

    [ ] Using curl / wget to get the .proto files from grpc-proxy project

    [ ] Continuous integration using gitlab
    	[ ] packaging .js files in target dir and publishing to artifactory / npm repo

    Most of them are captured here: 	https://jira.oraclecorp.com/jira/browse/COH-18934
