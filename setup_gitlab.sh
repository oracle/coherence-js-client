#! /bin/bash

export PROTO_SRC_DIR='./ext/proto'
export GEN_SRC_DIR='./src/cache/proto'
export GEN_OUT_DIR='./target/src/cache/proto'

mkdir -p ${PROTO_SRC_DIR} ${GEN_OUT_DIR} ${GEN_SRC_DIR}

cd ${PROTO_SRC_DIR} 
curl  --header "PRIVATE-TOKEN: ${PRIVATE_TOKEN}" \
      'https://gitlab-odx.oracledx.com/api/v4/projects/2418/repository/files/coherence-grpc-client%2Fsrc%2Fmain%2Fproto%2Fmessages%2Eproto/raw?ref=master' \
      > messages.proto
curl  --header "PRIVATE-TOKEN: ${PRIVATE_TOKEN}" \
      'https://gitlab-odx.oracledx.com/api/v4/projects/2418/repository/files/coherence-grpc-client%2Fsrc%2Fmain%2Fproto%2Fservices%2Eproto/raw?ref=master'
      > services.proto
cd ../..

# Now run the protoc compiler by running the setup.sh script
./setup.sh
