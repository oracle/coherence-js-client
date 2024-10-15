<!--
Copyright (c) 2020, 2023, Oracle and/or its affiliates.

Licensed under the Universal Permissive License v 1.0 as shown at
https://oss.oracle.com/licenses/upl.
 -->

# Developing Coherence JavaScript Client

### Requirements
* Node version 18.15.x or later
* NPM 9.x or later

### Runnable NPM Scripts
* `compile` - compiles the TypeScript sources to the `lib` directory
* `clean` - removes all generated code, coverage, and documentation artifacts
* `full-clean` - runs `clean` and removes the local `node_modules` directory 
* `test` - runs the unit tests
* `test-cycle` - starts the cluster and if successful, runs the unit tests.  After the cluster will be stopped.
* `coverage` - runs the unit tests and gathers coverage metrics (results found in `coverage` directory)
* `coh-up` - starts a two-member Coherence cluster for testing/developing against
* `coh-down` - stops the previously started Coherence cluster
* `dist` - creates a test distribution for inspection prior to publish

### Project Structure
* `bin` - various shell scripts that will be called by npm
* `etc` - contains the ProtoBuff .protoc files and other various files
* `src` - TypeScript source files and related resources
* `test` - contains the library test cases in plain JavaScript

### Building the Project
* run `npm install` - this will install the necessary dependencies and compile the grpc artifacts
* run `npm run compile` - this compiles the `Typescript` sources

### Running the Unit Tests
* run `npm run coh-up` - this starts a Coherence test Docker container.  This instance exposes the `grpc` port `1408` and exposes port `5005` for java debugging of the Coherence instance.  To view the JSON payloads being sent to Coherence, check the docker container log for the instance this command started.
* run `npm run test` - this will run all unit tests.  You may optionally run the tests individually via an IDE as long as the Coherence container mentioned in the previous step was started.
* run `npm run coh-down` when testing is complete and the Coherence test container is no longer needed.

The above can also be shortened to:
* `npm run test-cycle` - this will start the cluster, run test tests if the cluster start was successful, and then stop the cluster
* `npm run test-cycle-tls` - The same as `test-cycle`, but will use TLS

However, if developing new functionality or tests, the manual start of the cluster using `coh-up` may be preferred as
it avoids restarting the cluster allowing for quicker development times.

**Important!** When calling `coh-up`, `test`, `coh-down`, or `test-cycle` the LTS version of Coherence will be used (`22.06.10`).
To use a later Coherence version, such as `22.03`, prefix the calls with, or export `COHERENCE_VERSION=<desired-version>`.
For example:
```bash
COHERENCE_VERSION=22.03 npm run test-cycle
```

### Generating Documentation
* Install `typedoc` globally: `npm install -g typescript && npm install -g typedoc`
* Run `typedoc` from project root.  The Generated documentation
  will be available in the `docs` directory.

### Code Style
* Currently based on https://google.github.io/styleguide/jsguide#formatting

### FAQ
* Question:  How do I use the library locally in another project for testing purposes?
> Answer: First, run `npm link` within the `coherence-js-client` project to create a global NPM reference.
> then, from the project you want to use the library with, run `npm link @oracle/coherence` which
> will install the library for use with that project
