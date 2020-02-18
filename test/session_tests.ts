import { expect } from "chai";
import { suite, test, slow, timeout } from "mocha-typescript";

import { SessionBuilder } from "../src/cache/session";

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
                const cache = sess.getCache('sess-test');
                await cache.put('a', 'abc');
                expect(await cache.size()).to.equal(1);
                await sess.close();

                expect(sess.isClosed()).to.equal(true);
            }

            @test
            async shouldCreateCacheWithAddress() {
                const sess = new SessionBuilder()
                    .withAddress('localhost:1408').build();
                const cache = sess.getCache('sess-test');
                await cache.put('a', 'abc');
                expect(await cache.size()).to.equal(1);
                await sess.close();

                expect(sess.isClosed()).to.equal(true);
            }

            @test
            async shouldHaveZeroActiveCachesOnCreation() {
                const sess = new SessionBuilder()
                    .withAddress('localhost:1408').build();

                expect(sess.getActiveCacheCount()).to.equal(0);
                expect(sess.getActiveCacheNames().length).to.equal(0);

                await sess.close();
            }

            @test
            async shouldHaveCacheNameAfterGetCache() {
                const sess = new SessionBuilder()
                    .withAddress('localhost:1408').build();

                sess.getCache('sess-cache');
                expect(sess.getActiveCacheCount()).to.equal(1);
                expect(sess.getActiveCacheNames()[0]).to.equal('sess-cache');

                await sess.close();
            }


            @test
            async shouldReturnSameIntanceForSameCacheName() {
                const sess = new SessionBuilder()
                    .withAddress('localhost:1408').build();

                const cache1 = sess.getCache('sess-cache');
                const cache2 = sess.getCache('sess-cache');

                expect(sess.getActiveCacheCount()).to.equal(1);
                expect(sess.getActiveCacheNames()[0]).to.equal('sess-cache');

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
                expect(sess.getActiveCacheNames()).to.eql(['sess-cache-1', 'sess-cache-2']);

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
                expect(sess.getActiveCacheNames()).to.eql(['sess-cache-1', 'sess-cache-2']);

                expect(cache1 != cache2).to.equal(true);
                await sess.close();

                expect(sess.getActiveCacheCount()).to.equal(0);
                expect(sess.getActiveCacheNames()).to.eql([]);

                expect(cache1.isActive()).to.equal(false);
                expect(cache2.isActive()).to.equal(false);
            }

        }
    });
});