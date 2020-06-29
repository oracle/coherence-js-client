/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import {suite, test, timeout} from "@testdeck/mocha";

import {SessionBuilder} from '../src/cache/session';
import {expect} from "chai";

describe("LifecycleListener IT Test Suite", () => {

    const CACHE_NAME = 'lifecycle-listener-cache';

    @suite(timeout(15000))
    class LifecycleListenerTestSuite {

        @test
        async testCacheLifecycleListenerForRelease() {
            let sess = new SessionBuilder().build();
            const cache = sess.getCache(CACHE_NAME);

            const prom = new Promise((resolve, reject) => {
                cache.on('cache_released', (cacheName: string) => {
                    if (cacheName == CACHE_NAME) {
                        resolve();
                    }
                });

                cache.release();
            });

            await prom;
            await sess.close();
            await sess.waitUntilClosed();
        }

        @test
        async testCacheLifecycleListenerForDestroy() {

            let sess = new SessionBuilder().build();
            const cache = sess.getCache(CACHE_NAME);

            const prom = new Promise((resolve, reject) => {
                cache.on('cache_destroyed', (cacheName: string) => {
                    if (cacheName == CACHE_NAME) {
                        resolve();
                    }
                });

                setTimeout(() => {
                    cache.destroy();
                }, 100);
            });

            await prom;
            await sess.close();
            await sess.waitUntilClosed();
        }

        @test
        async testCacheLifecycleListenerForMultipleCaches() {

            let sess = new SessionBuilder().build();
            const cache = sess.getCache(CACHE_NAME);

            const prom1 = new Promise((resolve, reject) => {
                cache.on('cache_released', (cacheName: string) => {
                    if (cacheName == CACHE_NAME) {
                        resolve();
                    }
                });
                setTimeout(() => {
                    cache.release();
                }, 100);
            });


            const cache2 = sess.getCache('test-cache');
            const prom2 = new Promise((resolve, reject) => {
                cache2.on('cache_destroyed', (cacheName: string) => {
                    if (cacheName == 'test-cache') {
                        resolve();
                    }
                });
                setTimeout(() => {
                    cache2.destroy();
                }, 100);
            });

            await prom1;
            await prom2;
            await sess.close();
            await sess.waitUntilClosed();
        }

        @test
        async testSessionLifecycleListenerForCacheDestroy() {
            let sess = new SessionBuilder().build();
            const cache = sess.getCache(CACHE_NAME);
            const prom = new Promise((resolve, reject) => {
                sess.on('cache_destroyed', (cacheName: string, arg?: string) => {
                    if (cacheName == CACHE_NAME) {
                        resolve();
                    }
                });

                setTimeout(() => {
                    cache.destroy();
                }, 100);
            });

            await prom;
            await sess.close();
            await sess.waitUntilClosed();
        }

        @test
        async testSessionLifecycleListenerForMultipleCaches() {
            let sess = new SessionBuilder().build();
            const cache = sess.getCache(CACHE_NAME);
            const prom1 = new Promise((resolve, reject) => {
                sess.on('cache_released', (cacheName: string) => {
                    if (cacheName == CACHE_NAME) {
                        resolve();
                    }
                });
                setTimeout(() => {
                    cache.release();
                }, 100);
            });


            const cache2 = sess.getCache('test-cache');
            const prom2 = new Promise((resolve, reject) => {
                sess.on('cache_destroyed', (cacheName: string) => {
                    if (cacheName == 'test-cache') {
                        resolve();
                    }
                });
                setTimeout(() => {
                    cache2.destroy();
                }, 100);
            });


            await prom1;
            await prom2;
            await sess.close();
            await sess.waitUntilClosed();
        }

        @test
        async testIfSessionCloseTriggersCacheReleseEvents() {
            let sess = new SessionBuilder().build();
            const sessPromise = new Promise((resolve, reject) => {
                let count = 0;
                sess.on('registered', (name) => {
                    count++;
                    if (count == 2) {
                        sess.close();
                        resolve();
                    }
                });
            });
            const cache1 = sess.getCache('test-cache-1');
            const cache2 = sess.getCache('test-cache-2');

            const prom1 = new Promise((resolve, reject) => {
                sess.on('cache_released', (cacheName: string) => {
                    if (cacheName == 'test-cache-1') {
                        resolve();
                    }
                });
                sess.emit('registered', 'test-cache-1');
            });


            const prom2 = new Promise((resolve, reject) => {
                sess.on('cache_released', (cacheName: string) => {
                    if (cacheName == 'test-cache-2') {
                        resolve();
                    }
                });
                sess.emit('registered', 'test-cache-2');
            });

            // Wait for registration
            await sessPromise;

            await prom1;
            await prom2;

            await sess.waitUntilClosed();
            expect(sess.isClosed()).to.equal(true);
        }

    }

});