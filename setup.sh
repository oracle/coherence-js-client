#! /bin/bash

# Install dependent node modules
npm install


export GEN_SRC_DIR='./src/cache/proto'
export GEN_OUT_DIR='./target/src/cache/proto'

mkdir -p ${GEN_OUT_DIR} ${GEN_SRC_DIR}

# Generate TypeScript files
protoc --proto_path=./ext/proto \
	--plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \
	--plugin=protoc-gen-grpc=`which grpc_tools_node_protoc_plugin` \
	--js_out=import_style=commonjs:${GEN_OUT_DIR} \
	--ts_out="service=grpc-node:${GEN_SRC_DIR}" \
	--grpc_out=${GEN_OUT_DIR} \
	./ext/proto/*.proto
