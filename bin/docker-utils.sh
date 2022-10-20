#!/usr/bin/env bash

# Copyright (c) 2000, 2021, Oracle and/or its affiliates.
#
# Licensed under the Universal Permissive License v 1.0 as shown at
# http://oss.oracle.com/licenses/upl.

set -e

declare -r ROOT="${PWD}"
declare -r CONTAINER_NAME="coherence-js-test-container"
declare -r IMAGE_NAME="ghcr.io/oracle/coherence-ce:22.06.2"

function coh_up() {
  declare -r CONTAINER_ID=$(docker ps -a -q -f name="${CONTAINER_NAME}")
  if [[ -n "${CONTAINER_ID}" ]]; then
    docker start "${CONTAINER_ID}"
  else
    docker run -d -p 1408:1408 -p 5005:5005 -p 9612:9612 -p 6676:6676 --name "${CONTAINER_NAME}" -v \
      "${ROOT}"/etc:/args "${IMAGE_NAME}"
  fi
}

function coh_down() {
  declare -r CONTAINER_ID=$(docker ps -q -f name="${CONTAINER_NAME}")
  if [[ -n "${CONTAINER_ID}" ]]; then
    docker stop "${CONTAINER_ID}"
  fi
}

function coh_clean() {
  coh_down
  declare -r CONTAINER_ID=$(docker ps -a -q -f name="${CONTAINER_NAME}")
  if [[ -n "${CONTAINER_ID}" ]]; then
    docker rm "${CONTAINER_ID}"
  fi
}

while getopts "udc" OPTION; do
  case "${OPTION}" in
  u)
    coh_up
    ;;
  d)
    coh_down
    ;;
  c)
    coh_clean
    ;;
  ?)
    echo "Usage: $(basename "$0") [-u] [-d]"
    ;;
  esac
done
