# Readme

## How to build

1. You need to install protoc compiler for your platform.

2. `npm install`

3. Then run the following commands to generate protobuf artifacts.

```bash
mkdir packages/cache/proto

node_modules/.bin/grpc_tools_node_protoc \
	--proto_path=."/src/cache/proto" \
	--js_out="import_style=commonjs,binary:./packages/cache/proto" \
	--grpc_out="./packages/cache/proto" \
	--plugin=protoc-gen-grpc=`which grpc_tools_node_protoc_plugin` \
	-I src/cache/proto \
	./src/cache/proto/*.proto

protoc \
	--proto_path=./src/cache/proto \
	--plugin="protoc-gen-ts=./node_modules/.bin/protoc-gen-ts"  \
	--ts_out="service=grpc-node:./packages/cache/proto" \
	-I ./src/cache/proto \
	./src/cache/proto/*.proto
```

4. Then run: `./node_modules/.bin/tsc`
