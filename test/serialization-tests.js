/*
 * Copyright (c) 2023 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * https://oss.oracle.com/licenses/upl.
 */

const {util, Session} = require('../lib')
const assert = require('assert').strict
const {describe, it} = require('mocha');
const Decimal = require("decimal.js");
const test = require('./util')

describe('Serialization Unit/Integration Test Suite', () => {
    function getSimpleJson(forType, value) {
        return "{\"@class\": \"" + forType + "\", \"value\": \"" + value + "\"}"
    }

    function getNestedJSON(forType, value) {
        let simple = getSimpleJson(forType, value)
        return "{\n" +
            "  \"propA\": \"valueA\",\n" +
            "  \"propB\": [\n" +
            simple +
            "  ],\n" +
            "  \"inner\": {\n\"inner\":" +
            simple +
            "    }\n" +
            "  }"
    }

    describe("Serialization Unit Tests", () => {
        describe('When deserializing', () => {
            it('should be possible to deserialize a large decimal number from simple payload', () => {
                let serializer = new util.JSONSerializer()
                let result = serializer.deserialize(getSimpleJson("math.BigDec", "11.009283736183"))
                let expected = result instanceof Decimal
                assert.equal(expected, true)
            })

            it('should be possible to deserialize a large decimal number from nested payload', () => {
                let serializer = new util.JSONSerializer()
                let result = serializer.deserialize(getNestedJSON("math.BigDec", "11.009283736183"))
                let arrayResult = result["propB"][0] instanceof Decimal
                let innerResult = result["inner"]["inner"] instanceof Decimal
                console.log(typeof new Decimal("11.1111"))
                assert.equal(arrayResult, true)
                assert.equal(innerResult, true)
            })

            it('should be possible to deserialize a large integer number from simple payload', () => {
                let serializer = new util.JSONSerializer()
                let result = serializer.deserialize(getSimpleJson("math.BigInt", "11009283736183"))
                let expected = typeof result === "bigint"
                assert.equal(expected, true)
            })

            it('should be possible to deserialize a large integer number from nested payload', () => {
                let serializer = new util.JSONSerializer()
                let result = serializer.deserialize(getNestedJSON("math.BigInt", "11009283736183"))
                let arrayResult = typeof result["propB"][0] === "bigint"
                let innerResult = typeof result["inner"]["inner"] === "bigint"
                assert.equal(arrayResult, true)
                assert.equal(innerResult, true)
            })
        })

        describe('When serializing', () => {
            it('should be possible to serialize a large decimal number, standalone', () => {
                let serializer = new util.JSONSerializer()
                let result = serializer.serialize(new Decimal("11.02430570239475"))
                if (result.readInt8(0) === 21) {
                    result = result.subarray(1)
                }
                assert.equal(result.toString(), "{\"@class\":\"math.BigDec\",\"value\":\"11.02430570239475\"}")
            })

            it('should be possible to serialize a large decimal number, nested', () => {
                let serializer = new util.JSONSerializer()
                let testObj = {
                    id: new Decimal("11.02430570239475"),
                    arr: [new Decimal("11.02430570239474"), new Decimal("11.02430570239473")],
                    inner: {
                        inner: new Decimal("11.02430570239476")
                    }
                }
                let result = serializer.serialize(testObj)
                if (result.readInt8(0) === 21) {
                    result = result.subarray(1)
                }
                assert.equal(result.toString(), "{\"id\":{\"@class\":\"math.BigDec\",\"value\":\"11.02430570239475\"},\"arr\":[{\"@class\":\"math.BigDec\",\"value\":\"11.02430570239474\"},{\"@class\":\"math.BigDec\",\"value\":\"11.02430570239473\"}],\"inner\":{\"inner\":{\"@class\":\"math.BigDec\",\"value\":\"11.02430570239476\"}}}")
            })

            it('should be possible to serialize a large integer number, standalone', () => {
                let serializer = new util.JSONSerializer()
                let result = serializer.serialize(BigInt(11))
                if (result.readInt8(0) === 21) {
                    result = result.subarray(1)
                }
                assert.equal(result.toString(), "{\"@class\":\"math.BigInt\",\"value\":\"11\"}")
            })

            it('should be possible to serialize a large integer number, nested', () => {
                let serializer = new util.JSONSerializer()
                let testObj = {
                    id: BigInt("11"),
                    arr: [BigInt("12"), BigInt("13")],
                    inner: {
                        inner: BigInt("14")
                    }
                }
                let result = serializer.serialize(testObj)
                if (result.readInt8(0) === 21) {
                    result = result.subarray(1)
                }
                assert.equal(result.toString(), "{\"id\":{\"@class\":\"math.BigInt\",\"value\":\"11\"},\"arr\":[{\"@class\":\"math.BigInt\",\"value\":\"12\"},{\"@class\":\"math.BigInt\",\"value\":\"13\"}],\"inner\":{\"inner\":{\"@class\":\"math.BigInt\",\"value\":\"14\"}}}")
            })
        })
    })

    describe("Serialization Integration Tests", () => {
        const session = new Session()
        const cache = session.getCache("test-ser")

        after(async () => {
            await cache.release().finally(() => session.close().catch())
        })

        async function validateRoundTrip(expected) {
            await cache.set("a", expected)
            let result = await cache.get("a")
            assert.deepStrictEqual(result, expected)
        }

        it('should be possible to round-trip a large decimal number with Coherence', async () => {
            await validateRoundTrip(new Decimal("11.59999838372726283940498483472672627384384949484747376362627"))
        })

        it('should be possible to round-trip a large integer number with Coherence', async () => {
            await validateRoundTrip(BigInt("1159999838372726283940498483472672627384384949484747376362627"))
        })
    })
})
