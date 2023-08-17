#!/usr/bin/env bash

#
# Copyright (c) 2023, Oracle and/or its affiliates.
# Licensed under the Universal Permissive License v 1.0 as shown at
# https://oss.oracle.com/licenses/upl.
#

set -e

if [ "${COMPUTER_NAME}" == "" ]
then
    COMPUTER_NAME="127.0.0.1"
fi

CERTS_DIR=$1
if [ -z "${CERTS_DIR}" ] ; then
  echo "Please provide certs_dir"
  exit 1
fi

# check for location of openssl.cnf
if [ -f "/etc/ssl/openssl.cnf" ]; then
  export SSL_CNF=/etc/ssl/openssl.cnf
else
  export SSL_CNF=/etc/pki/tls/openssl.cnf
fi

mkdir -p "${CERTS_DIR}"

# Generate random passwords for each run
CAPASS="${RANDOM}"

echo Generate Guardians CA key:
echo "${CAPASS}" | openssl genrsa -passout stdin -aes256 \
    -out "${CERTS_DIR}"/guardians-ca.key 4096

echo Generate Guardians CA certificate:
echo "${CAPASS}" | openssl req -passin stdin -new -x509 -days 3650 \
    -reqexts SAN \
    -config <(cat "${SSL_CNF}" \
        <(printf "\n[SAN]\nsubjectAltName=DNS:localhost,DNS:127.0.0.1")) \
    -key "${CERTS_DIR}"/guardians-ca.key \
    -out "${CERTS_DIR}"/guardians-ca.crt \
    -subj "/CN=${COMPUTER_NAME}" # guardians-ca.crt is a trustCertCollectionFile

echo Generate client Star-Lord key
echo "${CAPASS}" | openssl genrsa -passout stdin -aes256 \
    -out "${CERTS_DIR}"/star-lord.key 4096

echo Generate client Star-Lord signing request:
echo "${CAPASS}" | openssl req -passin stdin -new \
    -key "${CERTS_DIR}"/star-lord.key \
    -out "${CERTS_DIR}"/star-lord.csr -subj "/CN=Star-Lord"

echo Self-signed client Star-Lord certificate:
echo "${CAPASS}" | openssl x509 -passin stdin -req -days 3650 \
    -in "${CERTS_DIR}"/star-lord.csr \
    -CA "${CERTS_DIR}"/guardians-ca.crt \
    -CAkey "${CERTS_DIR}"/guardians-ca.key \
    -set_serial 01 \
    -out "${CERTS_DIR}"/star-lord.crt # star-lord.crt is the certChainFile for the client (Mutual TLS only)

echo Remove passphrase from Star-Lord key:
echo "${CAPASS}" | openssl rsa -passin stdin \
    -in "${CERTS_DIR}"/star-lord.key \
    -out "${CERTS_DIR}"/star-lord.key

openssl pkcs8 -topk8 -nocrypt \
    -in "${CERTS_DIR}"/star-lord.key \
    -out "${CERTS_DIR}"/star-lord.pem # star-lord.pem is the privateKey for the Client (mutual TLS only)
