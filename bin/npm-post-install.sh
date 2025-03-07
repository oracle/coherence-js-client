#!/usr/bin/env bash

# Copyright (c) 2020, 2025, Oracle and/or its affiliates.
#
# Licensed under the Universal Permissive License v 1.0 as shown at
# https://oss.oracle.com/licenses/upl.

set -e

declare -r ROOT="${PWD}"

# Grabs the proto files from the Coherence project.
function grab_proto_files() {
  declare -r BASE_URL="https://raw.githubusercontent.com/oracle/coherence/24.09.3/prj/coherence-grpc/src/main/proto/"
  declare -r PROTO_FILES=("messages.proto" "services.proto" "proxy_service_v1.proto" "proxy_service_messages_v1.proto"
   "common_messages_v1.proto" "cache_service_messages_v1.proto")
  declare -r PROTO_DIR="${ROOT}/etc/proto"

  if [[ ! -d "${PROTO_DIR}" ]]; then
    mkdir -p "${PROTO_DIR}"
  fi

  cd "${ROOT}"

  for i in "${PROTO_FILES[@]}"; do curl -s "${BASE_URL}${i}" -o "${PROTO_DIR}/${i}"; done
}

# Generates and compiles the stubs generated from the installed proto files.
function gen_compile_proto_files() {
  declare -r PROTO_SRC_DIR="${ROOT}"/etc/proto
  declare -r PROTO_GEN_SRC_DIR="${ROOT}"/src/grpc
  declare -r PROTO_GEN_OUT_DIR="${ROOT}"/lib/grpc

  rm -rf "${PROTO_GEN_SRC_DIR}" "${PROTO_GEN_OUT_DIR}"
  mkdir -p "${PROTO_GEN_SRC_DIR}" "${PROTO_GEN_OUT_DIR}"

  npx grpc_tools_node_protoc \
    --plugin=protoc-gen-ts=node_modules/.bin/protoc-gen-ts \
    --ts_out=grpc_js:"${PROTO_GEN_SRC_DIR}" \
    --js_out=import_style=commonjs:"${PROTO_GEN_OUT_DIR}" \
    --grpc_out=grpc_js:"${PROTO_GEN_OUT_DIR}" \
    -I "${PROTO_SRC_DIR}" \
    "${PROTO_SRC_DIR}"/*.proto
}

function main() {
  cp "${ROOT}"/etc/jvm-args-clear.txt "${ROOT}"/etc/jvm-args.txt
  grab_proto_files
  gen_compile_proto_files
}

main
