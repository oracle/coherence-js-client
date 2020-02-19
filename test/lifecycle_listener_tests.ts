import { suite, test, slow, timeout } from "mocha-typescript";

import { NamedCacheClient } from "../src/cache/named_cache_client";
import { SessionBuilder } from '../src/cache/session';
import { expect } from "chai";

export const session = new SessionBuilder().build();

describe("LifecycleListener IT Test Suite", () => {

    const CACHE_NAME = 'lifecycle-listener-cache';

    let cache: NamedCacheClient;

    @suite(timeout(15000))
    class LifecycleListenerTestSuite {

        public async before() {
            cache = session.getCache(CACHE_NAME);
            await cache.clear();
        }

        public async after() {
            await cache.release();
        }

        @test
        async testCacheLifecycleListenerForRelease() {
            const prom = new Promise((resolve, reject) => {
                cache.on('cache_released', (cacheName: string) => {
                    if (cacheName == CACHE_NAME) {
                        resolve();
                    }
                });
            });

            cache.release();
            await prom;
        }

        @test
        async testCacheLifecycleListenerForDestroy() {
            const prom = new Promise((resolve, reject) => {
                cache.on('cache_destroyed', (cacheName: string) => {
                    if (cacheName == CACHE_NAME) {
                        resolve();
                    }
                });
            });

            cache.destroy();
            await prom;
        }

        @test
        async testCacheLifecycleListenerForMultipleCaches() {
            const prom1 = new Promise((resolve, reject) => {
                cache.on('cache_released', (cacheName: string) => {
                    if (cacheName == CACHE_NAME) {
                        resolve();
                    }
                });
            });


            const cache2 = session.getCache('test-cache');
            const prom2 = new Promise((resolve, reject) => {
                cache2.on('cache_destroyed', (cacheName: string) => {
                    if (cacheName == 'test-cache') {
                        resolve();
                    }
                });
            });

            cache.release();
            cache2.destroy();

            await prom1;
            await prom2;
        }

        @test
        async testSessionLifecycleListenerForCacheDestroy() {
            const prom = new Promise((resolve, reject) => {
                session.on('cache_destroyed', (cacheName: string, arg?: string) => {
                    if (cacheName == CACHE_NAME) {
                        resolve();
                    }
                });
            });

            cache.destroy();
            await prom;
        }

        @test
        async testSessionLifecycleListenerForMultipleCaches() {
            const prom1 = new Promise((resolve, reject) => {
                session.on('cache_released', (cacheName: string) => {
                    if (cacheName == CACHE_NAME) {
                        resolve();
                    }
                });
            });


            const cache2 = session.getCache('test-cache');
            const prom2 = new Promise((resolve, reject) => {
                session.on('cache_destroyed', (cacheName: string) => {
                    if (cacheName == 'test-cache') {
                        resolve();
                    }
                });
            });

            cache.release();
            cache2.destroy();

            await prom1;
            await prom2;
        }

        @test
        async testIfSessionCloseTriggersCacheReleseEvents() {
            let sess = new SessionBuilder().build();
            const cache1 = sess.getCache('test-cache-1');
            const prom1 = new Promise((resolve, reject) => {
                sess.on('cache_released', (cacheName: string) => {
                    if (cacheName == 'test-cache-1') {
                        resolve();
                    }
                });
            });


            const cache2 = sess.getCache('test-cache-2');
            const prom2 = new Promise((resolve, reject) => {
                sess.on('cache_released', (cacheName: string) => {
                    if (cacheName == 'test-cache-2') {
                        resolve();
                    }
                });
            });

            sess.close();

            await prom1;
            await prom2;

            await sess.waitUntilClosed();
            expect(sess.isClosed()).to.equal(true);
        }

    }

});