import { expect } from "chai";
import { suite, test, slow, timeout } from "mocha-typescript";

import { EventEmitter } from 'events';
import { NamedCacheClient } from "../src/cache/named_cache_client";
import { Filters } from '../src/filter/filters';
import { MapEventFilter } from '../src/filter/map_event_filter';
import { MapEvent } from "../src/util/map_event";
import { MapListener } from "../src/util/map_listener";
import { SessionBuilder } from '../src/cache/session';

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
            
            await cache.release();
            await prom;
        }
    }

});