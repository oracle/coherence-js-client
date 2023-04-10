#!/usr/bin/env bash

#
# Copyright (c) 2023, Oracle and/or its affiliates.
# Licensed under the Universal Permissive License v 1.0 as shown at
# https://oss.oracle.com/licenses/upl.
#

set -ex
mkdir -p "${PWD}"/etc/cert

function run_secure() {
  "${PWD}"/bin/keys.sh "${PWD}"/etc/cert
  cp "${PWD}"/etc/jvm-args-tls.txt "${PWD}"/etc/jvm-args.txt

  export COHERENCE_TLS_CERTS_PATH="${PWD}"/etc/cert/guardians-ca.crt
  export COHERENCE_TLS_CLIENT_CERT="${PWD}"/etc/cert/star-lord.crt
  export COHERENCE_TLS_CLIENT_KEY="${PWD}"/etc/cert/star-lord.pem
  export COHERENCE_IGNORE_INVALID_CERTS="true"

  run_tests
}

function run_clear() {
  cp "${PWD}"/etc/jvm-args-clear.txt "${PWD}"/etc/jvm-args.txt
  run_tests
}

function run_tests() {
  env
  npm run compile
  npm run coh-up
  sleep 10
  npm exec mocha "${PWD}"/test/**.js --recursive --exit
}

function cleanup() {
  timestamp=$(date +%s)
  docker-compose -f etc/docker-compose-2-members.yaml logs --no-color > logs-"$timestamp".txt
  npm run coh-down
  export -n COHERENCE_TLS_CERTS_PATH
  export -n COHERENCE_TLS_CLIENT_CERT
  export -n COHERENCE_TLS_CLIENT_KEY
  export -n COHERENCE_IGNORE_INVALID_CERTS
  cp "${PWD}"/etc/jvm-args-clear.txt "${PWD}"/etc/jvm-args.txt
  rm -rf "${PWD}"/etc/cert
  env
}

trap cleanup EXIT

while getopts "sc" OPTION; do
  case "${OPTION}" in
  s)
    run_secure
    ;;
  c)
    run_clear
    ;;
  ?)
    echo "Usage: $(basename "$0") [-s (run tests using TLS)] || [-c (run tests without TLS]]"
    exit 1
    ;;
  esac
done