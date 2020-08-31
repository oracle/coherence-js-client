<!--
Copyright (c) 2020 Oracle and/or its affiliates.

Licensed under the Universal Permissive License v 1.0 as shown at
http://oss.oracle.com/licenses/upl.
 -->

# Developing Coherence JavaScript Client

### Requirements
* [Protoc](https://grpc.io/docs/protoc-installation/) version 3.10.0 or later
* NPM version 6.x or later

### Runnable NPM Scripts
* `compile` - compiles the TypeScript sources to the `lib` directory
* `clean` - removes all generated code, coverage, and documentation artifacts
* `full-clean` - runs `clean` and removes the local `node_modules` directory 
* `test` - runs the unit tests
* `coverage` - runs the unit tests and gathers coverage metrics (results found in `coverage` directory)
* `coh-up` - starts a Coherence container for testing/developing against
* `coh-down` - stops the previously started Coherence container
* `coh-clean` - removes the local image
* `dist` - creates a test distribution for inspection prior to publish

### Project Structure
* `bin` - various shell scripts that will be called by npm
* `etc` - contains the ProtoBuff .protoc files and other various files
* `src` - TypeScript source files and related resources
* `test` - contains the library test cases in plain JavaScript

### Generating Documentation
* Install `typedoc` globally: `npm install -g typescript && npm install -g typedoc`
* Run `typedoc` from project root.  The Generated documentation
  will be available in the `docs` directory.

### Code Style
* Currently based on https://google.github.io/styleguide/jsguide#formatting

### FAQ
* Question:  How do I use the library locally in another project to test?
> Answer: First, run `npm link` within the `coherence-js-client` project to create a global NPM reference.
> then, from the project you want to use the library with, run `npm link @oracle/coherence` which
> will install the library for use with that project
