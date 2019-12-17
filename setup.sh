#! /bin/bash

# Install dependent node modules
npm install

export PROTO_SRC_DIR='./ext/proto'
export GEN_SRC_DIR='./src/cache/proto'
export GEN_OUT_DIR='./target/src/cache/proto'

mkdir -p ${PROTO_SRC_DIR} ${GEN_OUT_DIR} ${GEN_SRC_DIR}

cd ${PROTO_SRC_DIR} 
curl  --header "PRIVATE-TOKEN: ${PRIVATE_TOKEN}" \
      'https://gitlab-odx.oracledx.com/api/v4/projects/2418/repository/files/coherence-grpc-client%2Fsrc%2Fmain%2Fproto%2Fmessages%2Eproto/raw?ref=master'
curl  --header "PRIVATE-TOKEN: ${PRIVATE_TOKEN}" \
      'https://gitlab-odx.oracledx.com/api/v4/projects/2418/repository/files/coherence-grpc-client%2Fsrc%2Fmain%2Fproto%2Fservices%2Eproto/raw?ref=master'

cd ../..

# Generate TypeScript files
protoc --proto_path=${PROTO_SRC_DIR} \
	--plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \
	--plugin=protoc-gen-grpc=`which grpc_tools_node_protoc_plugin` \
	--js_out=import_style=commonjs:${GEN_OUT_DIR} \
	--ts_out="service=grpc-node:${GEN_SRC_DIR}" \
	--grpc_out=${GEN_OUT_DIR} \
	./ext/proto/*.proto
