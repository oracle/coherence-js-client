#!/usr/bin/env bash

# Copyright (c) 2020, 2023, Oracle and/or its affiliates.
#
# Licensed under the Universal Permissive License v 1.0 as shown at
# https://oss.oracle.com/licenses/upl.

set -e

declare VERSION=${COHERENCE_VERSION:=22.06.2}

function coh_up() {
  echo "Starting test containers ..."
  COHERENCE_VERSION="${VERSION}" docker-compose -f etc/docker-compose-2-members.yaml up --force-recreate --renew-anon-volumes -d
  SECONDS=0
  echo "Waiting for Coherence to be healthy (within 60s) ..."
  while [ ${SECONDS} -le 60 ]; do
    READY=$(curl -o /dev/null -s -w "%{http_code}" "http://127.0.0.1:6676/ready") || true
    if [ "${READY}" -eq "200" ]; then
      echo "Coherence is ready!"
      return
    fi

    sleep 5
  done
  node_version=$(node -v)
  filename="logs-startup-${VERSION}-${node_version}.txt"
  COHERENCE_VERSION="${VERSION}" docker-compose -f etc/docker-compose-2-members.yaml logs --no-color > "${filename}"
  echo "Coherence failed to become healthy.  See ${filename} for details."
  coh_down
  exit 1
}

function coh_down() {
  COHERENCE_VERSION="${VERSION}" docker-compose -f etc/docker-compose-2-members.yaml down -v
}

while getopts "ud" OPTION; do
  case "${OPTION}" in
  u)
    coh_up
    ;;
  d)
    coh_down
    ;;
  ?)
    echo "Usage: $(basename "$0") [-u] [-d]"
    exit 1
    ;;
  esac
done
