/*
 * Copyright (c) 2020, 2023 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * https://oss.oracle.com/licenses/upl.
 */
const Decimal = require("decimal.js");
const assert = require('assert').strict

const COHERENCE_VERSION = "COHERENCE_VERSION" in process.env ? process.env.COHERENCE_VERSION : "22.06"

module.exports = {
  COHERENCE_VERSION,

  checkNumericResult: function (result, expected) {
    let numberResultExpected = COHERENCE_VERSION.startsWith("22.06")

    if (numberResultExpected && typeof(result) === 'number') {
      assert.equal(result, expected)
    } else if (!numberResultExpected && result instanceof Decimal) {
      assert.deepStrictEqual(result, new Decimal(expected))
    } else if (!numberResultExpected && typeof(result) === 'bigint') {
        assert.deepStrictEqual(result, BigInt(expected))
    } else {
      assert(false, "Unexpected result type [" + typeof(result) + "]")
    }
  },

  compareEntries: async function (control /* array of array */, test /* Iterable */) {
    const testLen = Array.isArray(test) ? test.length : await test.size
    assert.equal(testLen, control.length, 'Incorrect number of entries returned')
    for (const entry of control) {
      let foundKey = false
      let foundVal = false
      const controlKey = entry[0]
      const controlVal = entry[1]
      for await (const testEntry of test) {
        let testKey
        let testVal

        if (testEntry.key) {
          testKey = testEntry.key
          testVal = testEntry.value
        } else if (Array.isArray(testEntry)) {
          testKey = testEntry[0]
          testVal = testEntry[1]
        } else {
          testKey = testEntry['key']
          testVal = testEntry['value']
        }

        try {
          assert.deepEqual(testKey, controlKey)
          foundKey = true
        } catch (error) {
          // ignored
        }

        try {
          assert.deepEqual(testVal, controlVal)
          foundVal = true
        } catch (error) {
          // ignored
        }

        if (foundKey) {
          break
        }
      }

      if (!foundKey) {
        console.log('Unable to find key \'' + JSON.stringify(controlKey) + '\' in entries sent from server: ')
        for await (const e of test) {
          let testKey

          if (e.key) {
            testKey = e.key
          } else if (Array.isArray(e)) {
            testKey = e[0]
          } else {
            testKey = e['key']
          }
          console.log('\t    ' + JSON.stringify(testKey))
        }
      }
      if (!foundVal) {
        console.log('Unexpected value associated with key \'' + JSON.stringify(controlKey) + '\'.  Expected value \'' + JSON.stringify(controlVal) + '\' in entry sent from server: ')
        for await (const e of test) {
          let testKey
          let testVal

          if (e.key) {
            testKey = e.key
            testVal = e.value
          } else if (Array.isArray(e)) {
            testKey = e[0]
            testVal = e[1]
          } else {
            testKey = e['key']
            testVal = e['value']
          }
          console.log('\t    ' + JSON.stringify(testKey) + ', ' + JSON.stringify(testVal))
        }
      }

      if (!foundKey || !foundVal) {
        assert.fail()
      }
    }
  },

  compareElements: async function (control /* array */, test /* set */) {
    const testLen = Array.isArray(test) ? test.length : await test.size
    assert.equal(testLen, control.length, 'Incorrect number of elements returned')
    for (const element of control) {
      let found = false
      for await (const testElement of test) {
        try {
          assert.deepEqual(testElement, element)
          found = true
        } catch (error) {
          // ignored
        }
      }
      if (!found) {
        console.log('Unexpected or missing value in provided set: \'' + JSON.stringify(test) + '\', expected \'' + JSON.stringify(control) + '\'')
        assert.fail()
      }
    }
  }
}