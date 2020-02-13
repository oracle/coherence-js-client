# Readme

## How to build

1. You need to install:
   1.1 protoc compiler for your platform. On mac use `brew install protoc`
   1.2 node v12.13.0

2. Checkout the `coherence-js` workspace and run `npm install`
   2.1 Make sure you have the proxy setup properly (check in ~/.npmrc)
   2.2: git clone https://gitlab-odx.oracledx.com/coherence/coherence-js.git
   2.3 npm install

3. Generate proto source files:
   3.1 Make sure you have messages.proto and services.proto in `ext/proto` directory. This is yet to
   be automated. We can use `curl` or `wget` to get these files from:
   https://gitlab-odx.oracledx.com/coherence/coherence-grpc-proxy/tree/master/coherence-grpc-client/src/main/proto

   3.2 Then run: setup.sh (This will generate .ts and .js files from .proto files)

4. Then run: `npm test`


