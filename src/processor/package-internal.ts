/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { Map } from '../util'
/**
 * @hidden
 */
export module internal {
  export function processorName(name: string): string {
    return 'processor.' + name
  }

  export class MapHolder<K, V> {
    entries: Array<{ key: any, value: any }>

    constructor (entries: Map<K, V>) {
      this.entries = new Array<{ key: K, value: V }>()
      for (const [k, v] of entries) {
        this.entries.push({key: k, value: v})
      }
    }
  }
}