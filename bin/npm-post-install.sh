#!/usr/bin/env bash
set -e

declare -r ROOT="$PWD"

# Creates a shallow copy of the coherence-grpc-proxy git project and uses
# a sparse checkout filter only checkout the proto files.  The proto
# files are then linked to the PROJECT_ROOT/etc/proto directory.
function grab-proto-files() {
    declare -r ETC_DIR="${ROOT}/etc"
    declare -r GRPC_ORIGIN="git@gitlab-odx.oracledx.com:coherence/coherence-grpc-proxy.git"
    declare -r SPARSE_GRPC_COPY="./.coherence-grpc-proxy"
    declare -r PROTO_PATH="coherence-grpc-client/src/main/proto"

    cd ${ROOT}

    rm -rf ${ETC_DIR} ${SPARSE_GRPC_COPY}
    mkdir ${ETC_DIR} ${SPARSE_GRPC_COPY} && cd ${SPARSE_GRPC_COPY}

    git init
    git remote add -f origin ${GRPC_ORIGIN}
    git config core.sparseCheckout true

    echo ${PROTO_PATH}/* > .git/info/sparse-checkout

    git pull --depth=1 origin master

    ln -s ${PWD}/${PROTO_PATH} ${ETC_DIR}
    cd ${ROOT}
}

function compile-proto-files() {
    echo $PWD
    declare -r PROTO_SRC_DIR="${PWD}/etc/proto"
    declare -r PROTO_GEN_SRC_DIR="${PWD}/src/cache/proto"
    declare -r PROTO_GEN_OUT_DIR="${PWD}/target/src/cache/proto"

    rm -rf ${PROTO_GEN_SRC_DIR} ${PROTO_GEN_OUT_DIR}
    mkdir -p ${PROTO_GEN_SRC_DIR} ${PROTO_GEN_OUT_DIR}

    protoc --proto_path=${PROTO_SRC_DIR} \
	  --plugin=protoc-gen-ts=node_modules/.bin/protoc-gen-ts \
	  --plugin=protoc-gen-grpc=node_modules/.bin/grpc_tools_node_protoc_plugin \
	  --js_out=import_style=commonjs:${PROTO_GEN_OUT_DIR} \
	  --ts_out="service=grpc-node:${PROTO_GEN_SRC_DIR}" \
	  --grpc_out=${PROTO_GEN_OUT_DIR} \
	  ${PROTO_SRC_DIR}/*.proto
}

function main() {
    grab-proto-files
    compile-proto-files
}

main