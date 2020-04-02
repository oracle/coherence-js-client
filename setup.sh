#! /bin/bash

export PROTO_SRC_DIR='./ext/proto'
export GEN_SRC_DIR='./src/cache/proto'
export GEN_OUT_DIR='./target/src/cache/proto'

mkdir -p ${PROTO_SRC_DIR} ${GEN_OUT_DIR} ${GEN_SRC_DIR}

# At this point, we have the .proto files in PROTO_SRC_DIR
# We now run the protoc tool which will read the .proto files
# and generates the .ts files in GEN_SRC_DIR
# and generates the .js files (for messages and services) in GEN_OUT_DIR

protoc --proto_path=${PROTO_SRC_DIR} \
	--plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \
	--plugin=protoc-gen-grpc=./node_modules/.bin/grpc_tools_node_protoc_plugin \
	--js_out=import_style=commonjs:${GEN_OUT_DIR} \
	--ts_out="service=grpc-node:${GEN_SRC_DIR}" \
	--grpc_out=${GEN_OUT_DIR} \
	./ext/proto/*.proto
