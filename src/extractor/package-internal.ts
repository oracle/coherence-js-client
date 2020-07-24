/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

/**
 * @hidden
 */
export module internal {
  export function extractorName(name: string): string {
    return 'extractor.' + name
  }
}