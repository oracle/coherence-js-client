#!/usr/bin/env bash

# Copyright (c) 2000, 2020, Oracle and/or its affiliates.
#
# Licensed under the Universal Permissive License v 1.0 as shown at
# http://oss.oracle.com/licenses/upl.

set -e

declare -r PROXY="http://www-proxy-hqdc.us.oracle.com:80"
declare -r REGISTRY="http://artifactory-slc.oraclecorp.com/artifactory/api/npm/npmjs-remote"
declare -r NO_PROXY="no-proxy=.us.oracle.com,.oracle.com,.oraclecorp.com"
declare -r NPM_RC="${PWD}/.npmrc"

function set-configuration() {
    echo "proxy=${PROXY}" > ${NPM_RC}
    echo "https-proxy=${PROXY}" >> ${NPM_RC}
    echo "${NO_PROXY}" >> ${NPM_RC}
    echo "registry=${REGISTRY}" >> ${NPM_RC}
}

function main() {
    set-configuration
}

main