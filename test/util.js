const assert = require('assert').strict

module.exports = {
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

        if (typeof testEntry.getKey === 'function') {
          testKey = testEntry.getKey()
          testVal = testEntry.getValue()
        } else {
          testKey = testEntry[0]
          testVal = testEntry[1]
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
          break;
        }
      }

      if (!foundKey) {
        console.log('Unable to find key \'' + JSON.stringify(controlKey) + '\' in entry sent from server: ')
        for await (const e of test) {
          console.log('\t    ' + JSON.stringify(e[0]))
        }
      }
      if (!foundVal) {
        console.log('Unexpected value associated with key \'' + JSON.stringify(controlKey) + '\'.  Expected value \'' + JSON.stringify(controlVal) + '\' in entry sent from server: ')
        for await (const e of test) {
          console.log('\t    ' + JSON.stringify(e[0]) + ', ' + JSON.stringify(e[1]))
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