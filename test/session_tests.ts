/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import {expect} from "chai";
import {suite, test, timeout} from "@testdeck/mocha";

import {SessionBuilder} from "../src/cache/session";

describe("Session IT Test Suite", () => {

    describe("Session Unit Tests", () => {

        @suite(timeout(15000))
        class SessionTestsSuite {

            @test
            async shouldBeDefaultAddressWithDefaultSessionBuilder() {
                const builder = new SessionBuilder();
                expect(builder.getSessionOptions().address).to.equal(SessionBuilder.DEFAULT_ADDRESS);
                expect(builder.getSessionOptions().tlsEnabled).to.equal(false);
            }

            @test
            async shouldBeAbleToSpecifyAddressWithBuilder() {
                const builder = new SessionBuilder();
                builder.withAddress('abc:1234');
                expect(builder.getSessionOptions().address).to.equal('abc:1234');
                expect(builder.getSessionOptions().tlsEnabled).to.equal(false);
            }

            @test
            async shouldBeAbleToSpecifyRequestTimeoutWithBuilder() {
                const builder = new SessionBuilder();
                builder.withRequestTimeout(1234);
                expect(builder.getSessionOptions().address).to.equal(SessionBuilder.DEFAULT_ADDRESS);
                expect(builder.getSessionOptions().tlsEnabled).to.equal(false);
                expect(builder.getSessionOptions().requestTimeoutInMillis).to.equal(1234);
            }

            @test
            async shouldBeAbleToSpecifyTlsWithBuilder() {
                const builder = new SessionBuilder();
                builder.enableTls();
                expect(builder.getSessionOptions().address).to.equal(SessionBuilder.DEFAULT_ADDRESS);
                expect(builder.getSessionOptions().tlsEnabled).to.equal(true);
            }

            @test
            async shouldCreateCacheWithDefaultAddress() {
                const sess = new SessionBuilder().build();
                const cache = sess.getCache('sess-test-1');
                await cache.put('a', 'abc');
                expect(await cache.size()).to.equal(1);

                await sess.close();
                await sess.waitUntilClosed();
                expect(sess.isClosed()).to.equal(true);

            }

            @test
            async shouldHaveZeroActiveCachesOnCreation() {
                const sess = new SessionBuilder()
                    .withAddress('localhost:1408').build();

                expect(sess.getActiveCacheCount()).to.equal(0);
                expect(sess.getActiveCaches().length).to.equal(0);

                await sess.close();
            }

            @test
            async shouldHaveCacheNameAfterGetCache() {
                const sess = new SessionBuilder()
                    .withAddress('localhost:1408').build();

                sess.getCache('sess-cache');
                expect(sess.getActiveCacheCount()).to.equal(1);
                expect(sess.getActiveCaches()[0].getCacheName()).to.equal('sess-cache');

                await sess.close();
            }


            @test
            async shouldReturnSameIntanceForSameCacheName() {
                const sess = new SessionBuilder()
                    .withAddress('localhost:1408').build();

                const cache1 = sess.getCache('sess-cache');
                const cache2 = sess.getCache('sess-cache');

                expect(sess.getActiveCacheCount()).to.equal(1);
                expect(sess.getActiveCaches()[0].getCacheName()).to.equal('sess-cache');

                expect(cache1 == cache2).to.equal(true);
                await sess.close();
            }

            @test
            async shouldReturnDifferentIntancesOfActiveCachesForDifferentCacheName() {
                const sess = new SessionBuilder()
                    .withAddress('localhost:1408').build();

                const cache1 = sess.getCache('sess-cache-1');
                const cache2 = sess.getCache('sess-cache-2');

                expect(cache1.isActive()).to.equal(true);
                expect(cache2.isActive()).to.equal(true);

                expect(sess.getActiveCacheCount()).to.equal(2);
                expect(sess.getActiveCacheNames()).to.eql(new Set(['sess-cache-1', 'sess-cache-2']));

                expect(cache1 != cache2).to.equal(true);
                await sess.close();
            }

            @test
            async shouldHaveReleasedAllCachesOnSessionClose() {

                const sess = new SessionBuilder()
                    .withAddress('localhost:1408').build();

                const cache1 = sess.getCache('sess-cache-1');
                const cache2 = sess.getCache('sess-cache-2');

                expect(sess.getActiveCacheCount()).to.equal(2);
                expect(sess.getActiveCacheNames()).to.eql(new Set(['sess-cache-1', 'sess-cache-2']));

                expect(cache1 != cache2).to.equal(true);
                await sess.close();
                await sess.waitUntilClosed();

                expect(sess.getActiveCacheCount()).to.equal(0);
                expect(sess.getActiveCaches()).to.eql([]);

                expect(cache1.isActive()).to.equal(false);
                expect(cache2.isActive()).to.equal(false);
            }

            @test
            async shouldReleaseCacheFromSessionOnCacheRelease() {
                const sess = new SessionBuilder()
                    .withAddress('localhost:1408').build();

                const cache1 = sess.getCache('sess-test-cache-1');
                const cache2 = sess.getCache('sess-test-cache-2');

                expect(sess.getActiveCacheCount()).to.equal(2);
                expect(sess.getActiveCacheNames()).to.eql(new Set(['sess-test-cache-1', 'sess-test-cache-2']));

                expect(cache1 != cache2).to.equal(true);
                const prom = new Promise((resolve, reject) => {
                    cache1.on('cache_released', (cacheName: string) => {
                        if (cacheName == 'sess-test-cache-1') {
                            resolve();
                        }
                    })
                });
                await cache1.release();
                await prom;

                expect(sess.getActiveCacheCount()).to.equal(1);
                expect(sess.getActiveCacheNames()).to.eql(new Set(['sess-test-cache-2']));

                expect(cache1.isActive()).to.equal(false);
                expect(cache2.isActive()).to.equal(true);

                await sess.close();
                await sess.waitUntilClosed();

                expect(sess.getActiveCacheCount()).to.equal(0);
                expect(sess.getActiveCaches()).to.eql([]);

                expect(cache1.isActive()).to.equal(false);
                expect(cache2.isActive()).to.equal(false);


            }

        }
    });
});