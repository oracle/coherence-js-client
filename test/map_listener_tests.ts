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

describe("MapListener IT Test Suite", () => {

    let cache: NamedCacheClient;

    @suite(timeout(15000))
    class MapListenerTestSuite {

        public async before() {
            cache = session.getCache('map-listener-cache');
            await cache.clear();
        }

        public async after() {
            await cache.release();
        }

        @test
        async shouldNotHaveReceivedAnyEventsWhenNoUpdatesToCache() {
            const prom = new Promise((resolve, reject) => {
                cache.on('cache_destroyed', (cacheName: string) => {
                    resolve();
                })
            });
            const listener = new CountingMapListener("listener-default");
            await cache.addMapListener(listener, true);
            await cache.destroy();
            await prom;
            expect(stringify(listener.counters)).to.equal(stringify({}));
        }

        @test
        async testAllEventsMapListener() {
            const prom = new Promise((resolve, reject) => {
                cache.on('cache_destroyed', (cacheName: string) => {
                    resolve();
                })
            });

            const listener = new CountingMapListener("listener-default");
            await cache.addMapListener(listener, false);

            await cache.put('123', { xyz: '123-xyz' });
            await cache.remove('123');

            await listener.waitFor({ insert: 1, delete: 1 });
            await cache.destroy();

            await prom;
            expect(stringify(listener.counters)).to.equal(stringify({ insert: 1, delete: 1 }));
        }

        @test
        async testMultipleAllEventsMapListener() {
            const prom = new Promise((resolve, reject) => {
                cache.on('cache_destroyed', (cacheName: string) => {
                    resolve();
                })
            });
            const listener = new CountingMapListener("listener-default");
            await cache.addMapListener(listener, true);

            await cache.put('123', {});
            await cache.remove('123');

            await listener.waitFor({ insert: 1, delete: 1 });
            const listener2 = new CountingMapListener("listener-2");
            await cache.addMapListener(listener2);

            await cache.put('123', { a: 2 });
            await cache.remove('123');

            await cache.destroy();
            await prom;

            expect(stringify(listener.counters)).to.equal(stringify({ insert: 2, delete: 2 }));
            expect(stringify(listener2.counters)).to.equal(stringify({ insert: 1, delete: 1 }));
        }

        @test
        async shouldReceiveEventsWithAlwaysFilter() {
            const prom = new Promise((resolve, reject) => {
                cache.on('cache_destroyed', (cacheName: string) => {
                    resolve();
                })
            });
            const listener = new CountingMapListener("listener-default");
            await cache.addMapListener(listener, true);
            const filterListener = new CountingMapListener("filter-listener");
            await cache.addMapListener(filterListener, new MapEventFilter(Filters.always()));

            setTimeout(() => {
                cache.put('123', {});
            }, 100);

            setTimeout(() => {
                cache.remove('123');
            }, 150);

            setTimeout(() => {
                cache.put('345', {});
            }, 200);

            await listener.waitFor({ insert: 2, delete: 1 });

            await cache.removeMapListener(listener);

            await cache.put('k2', { a: 2 });
            await cache.remove('k2');

            await filterListener.waitFor({ insert: 3, delete: 2 });

            await cache.destroy();
            await prom;

            expect(stringify(listener.counters)).to.equal(stringify({ insert: 2, delete: 1 }));
            expect(stringify(filterListener.counters)).to.equal(stringify({ insert: 3, delete: 2 }));
        }

        @test
        async shouldCloseChannelReleaseIsCalled() {
            // Use a KeyListener and a FilterListener
            const prom = new Promise((resolve, reject) => {
                cache.on('cache_released', (cacheName: string) => {
                    resolve();
                })
            });
            const keyListener = new CountingMapListener("key-listener");
            const filterListener = new CountingMapListener("filter-listener");

            const mapEventFilter = new MapEventFilter(Filters.equal('id', '123'));
            await cache.addMapListener(filterListener, mapEventFilter, false);
            await cache.addMapListener(keyListener, '123', false);

            await cache.removeMapListener(keyListener, '123');
            await cache.removeMapListener(filterListener, mapEventFilter);

            await cache.release();
            await prom;

            expect(stringify(keyListener.counters)).to.equal(stringify({}));
            expect(stringify(filterListener.counters)).to.equal(stringify({}));
        }

        @test
        async shouldReceiveEventsForRemainingListenersAfterOneListenerIsUnregistered() {
            // Use 2 KeyListeners and two FilterListeners
            const prom = new Promise((resolve, reject) => {
                cache.on('cache_released', (cacheName: string) => {
                    resolve();
                })
            });
            const keyListener1 = new CountingMapListener("key-listener-1");
            const keyListener2 = new CountingMapListener("key-listener-2");
            const filterListener1 = new CountingMapListener("filter-listener-1");
            const filterListener2 = new CountingMapListener("filter-listener-2");

            const mapEventFilter = new MapEventFilter(Filters.equal('id', '123'));
            await cache.addMapListener(keyListener1, '123', false);
            await cache.addMapListener(filterListener1, mapEventFilter, false);
            await cache.addMapListener(filterListener2, mapEventFilter, false);
            await cache.addMapListener(keyListener2, '123', false);

            await cache.put('123', { 'id': '123', value: 123, insCount: 1 });
            await cache.remove('123');

            await keyListener1.waitFor({ insert: 1, delete: 1 });
            await filterListener2.waitFor({ insert: 1, delete: 1 });

            await cache.removeMapListener(keyListener1, '123');
            await cache.removeMapListener(filterListener2, mapEventFilter);

            await cache.put('123', { 'id': '123', value: 456, insCount: 2 });
            await cache.remove('123');

            await keyListener2.waitFor({ insert: 2, delete: 2 });
            await filterListener1.waitFor({ insert: 2, delete: 2 });
            await cache.removeMapListener(filterListener1, mapEventFilter);
            await cache.removeMapListener(keyListener2, '123');

            await cache.release();
            await prom;

            expect(stringify(keyListener1.counters)).to.equal(stringify({ insert: 1, delete: 1 }));
            expect(stringify(filterListener2.counters)).to.equal(stringify({ insert: 1, delete: 1 }));

            expect(stringify(filterListener1.counters)).to.equal(stringify({ insert: 2, delete: 2 }));
            expect(stringify(keyListener2.counters)).to.equal(stringify({ insert: 2, delete: 2 }));
        }

        @test
        async shouldBeAbleToRegisterCacheLifecycleListenersForCacheDestroy() {
            let truncateCount = 0;
            let destroyCount = 0;

            const prom = new Promise((resolve, reject) => {
                cache.on('cache_truncated', (cacheName: string) => {
                    truncateCount++;
                })
                cache.on('cache_destroyed', (cacheName: string) => {
                    destroyCount++;

                    expect(truncateCount).to.equal(2);
                    expect(destroyCount).to.equal(1);

                    resolve();
                })
            });

            await cache.put('a', 'b');
            await cache.truncate();
            await cache.put('a1', 'b1');
            await cache.truncate();
            await cache.destroy();

            await prom;
        }
        @test
        async shouldBeAbleToRegisterCacheLifecycleListenersForCacheRelease() {
            let truncateCount = 0;
            let releasedCount = 0;

            const prom = new Promise((resolve, reject) => {
                cache.on('cache_truncated', (cacheName: string) => {
                    truncateCount++;
                })
                cache.on('cache_released', (cacheName: string) => {
                    releasedCount++;

                    expect(truncateCount).to.equal(2);
                    expect(releasedCount).to.equal(1);

                    resolve();
                })
            });

            await cache.put('a', 'b');
            await cache.truncate();
            await cache.put('a1', 'b1');
            await cache.truncate();
            await cache.release();

            await prom;
        }
    }

    type CallbackCounters = {
        insert?: number,
        update?: number,
        delete?: number,
        truncate?: number,
        destroy?: number,
        open?: number,
        close?: number
    };

    class CountingMapListener<K = any, V = any>
        extends EventEmitter
        implements MapListener<K, V> {

        name: string;

        counters: CallbackCounters;

        nextId = 0;

        conditions = new Map<number, () => void>();

        private static RESOLVED = Promise.resolve();

        constructor(name: string) {
            super();
            this.name = name;
            this.counters = createNewCounter();
        }

        waitFor(expected: CallbackCounters): Promise<void> {
            if (checkValue(expected, this.counters) == null) {
                return CountingMapListener.RESOLVED;
            }

            const self = this;
            return new Promise((resolve, reject) => {
                self.on('event', (eventName, cacheEventName) => {
                    if (checkValue(expected, this.counters) == null) {
                        resolve();
                    }
                });
            });
        }

        entryDeleted(event: MapEvent<K, V>): void {
            this.counters.delete = this.counters.delete ? this.counters.delete + 1 : 1;
            super.emit('event', 'delete');
        }

        entryInserted(event: MapEvent<K, V>): void {
            this.counters.insert = this.counters.insert ? this.counters.insert + 1 : 1;
            super.emit('event', 'insert');
        }

        entryUpdated(event: MapEvent<K, V>): void {
            this.counters.update = this.counters.update ? this.counters.update + 1 : 1;
            super.emit('event', 'update');
        }

    }

    function stringify(obj: CallbackCounters): string {
        return JSON.stringify((JSON.parse(JSON.stringify(obj))));
    }

    function createNewCounter(): CallbackCounters {
        return {};
    }

    function checkValue(expected: CallbackCounters, actual: CallbackCounters): string | null {
        if (expected.update != undefined) {
            if (actual.update == undefined || actual.update != expected.update) {
                return "mismatch in update;  expected: " + expected.update + " but got: " + actual.update;
            }
        }

        if (expected.insert != undefined) {
            if (actual.insert == undefined || actual.insert != expected.insert) {
                return "mismatch in insert;  expected: " + expected.insert + " but got: " + actual.insert;
            }
        }

        if (expected.delete != undefined) {
            if (actual.delete == undefined || actual.delete != expected.delete) {
                return "mismatch in delete;  expected: " + expected.delete + " but got: " + actual.delete;
            }
        }

        return null;
    }

});