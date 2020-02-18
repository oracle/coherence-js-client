import { expect } from "chai";
import { suite, test, slow, timeout } from "mocha-typescript";

import { EventEmitter } from 'events';
import { NamedCacheClient } from "../src/cache/named_cache_client";
import { Filters } from '../src/filter/filters';
import { MapEventFilter } from '../src/filter/map_event_filter';
import { MapEvent } from "../src/util/map_event";
import { MapListener } from "../src/util/map_listener";
import { TestUtil, session, val123, val234, val345, val456 } from './abstract_named_cache_tests';

describe("MapListener IT Test Suite", () => {

    let cache: NamedCacheClient;

    class MapListenerTestSuite {

        public static before() {
            cache = session.getCache('map-listener-cache');
        }

        public async before() {
            await cache.clear();
            await TestUtil.populateCache(cache);
        }

        public static after() {
            cache.release();
        }

        protected static async populateCache(cache: NamedCacheClient<any, any>) {
            await cache.put("123", val123)
            await cache.put("234", val234)
            await cache.put("345", val345)
            await cache.put("456", val456)
        }

        protected extractKeysAndValues(map: Map<any, any>): { keys: Array<any>, values: Array<any> } {
            const keys = new Array<any>();
            const values = new Array<any>();

            for (let [key, value] of map) {
                keys.push(key);
                values.push(value);
            }
            return { keys, values };
        }

        @test
        async shouldNotHaveReceivedAnyEventsWhenNoUpdatesToCache() {
            const lcListener = new TestCacheMapLifecycleListener(cache);
            const listener = new CountingMapListener("listener-default");
            await cache.addMapListener(listener, true);

            cache.destroy();
            await lcListener.waitForChannelClose();
            expect(stringify(listener.counters)).to.equal(stringify({}));
        }

        @test
        async testAllEventsMapListener() {
            const lcListener = new TestCacheMapLifecycleListener(cache);
            const listener = new CountingMapListener("listener-default");
            await cache.addMapListener(listener, true);

            await cache.put('123', {});
            await cache.remove('123');

            await listener.waitFor({ insert: 1, delete: 1 });

            cache.destroy();

            await lcListener.waitForChannelClose();
            expect(stringify(listener.counters)).to.equal(stringify({ insert: 1, delete: 1 }));
        }

        @test
        async testMultipleAllEventsMapListener() {
            const lcListener = new TestCacheMapLifecycleListener(cache);
            const listener = new CountingMapListener("listener-default");
            await cache.addMapListener(listener, true);

            await cache.put('123', {});
            await cache.remove('123');

            await listener.waitFor({ insert: 1, delete: 1 });
            const listener2 = new CountingMapListener("listener-2");
            await cache.addMapListener(listener2);

            await cache.put('123', { a: 2 });
            await cache.remove('123');

            cache.destroy();

            await lcListener.waitForChannelClose();

            expect(stringify(listener.counters)).to.equal(stringify({ insert: 2, delete: 2 }));
            expect(stringify(listener2.counters)).to.equal(stringify({ insert: 1, delete: 1 }));
        }

        @test
        async shouldReceiveEventsWithAlwaysFilter() {
            const lcListener = new TestCacheMapLifecycleListener(cache);
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

            cache.destroy();

            await lcListener.waitForChannelClose();

            expect(stringify(listener.counters)).to.equal(stringify({ insert: 2, delete: 1 }));
            expect(stringify(filterListener.counters)).to.equal(stringify({ insert: 3, delete: 2 }));
        }

        @test
        async shouldCloseChannelReleaseIsCalled() {
            // Use a KeyListener and a FilterListener
            const lcListener = new TestCacheMapLifecycleListener(cache);
            const keyListener = new CountingMapListener("key-listener");
            const filterListener = new CountingMapListener("filter-listener");

            const mapEventFilter = new MapEventFilter(Filters.equal('id', '123'));
            await cache.addMapListener(filterListener, mapEventFilter, false);
            await cache.addMapListener(keyListener, '123', false);

            await cache.removeMapListener(keyListener, '123');
            await cache.removeMapListener(filterListener, mapEventFilter);

            await cache.release();

            expect(stringify(keyListener.counters)).to.equal(stringify({}));
            expect(stringify(filterListener.counters)).to.equal(stringify({}));
        }

        @test
        async shouldReceiveEventsForRemainingListenersAfterOneListenerIsUnregistered() {
            // Use 2 KeyListeners and two FilterListeners
            const lcListener = new TestCacheMapLifecycleListener(cache);
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

            expect(stringify(keyListener1.counters)).to.equal(stringify({ insert: 1, delete: 1 }));
            expect(stringify(filterListener2.counters)).to.equal(stringify({ insert: 1, delete: 1 }));

            expect(stringify(filterListener1.counters)).to.equal(stringify({ insert: 2, delete: 2 }));
            expect(stringify(keyListener2.counters)).to.equal(stringify({ insert: 2, delete: 2 }));
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


    class TestCacheMapLifecycleListener<K = any, V = any>
        extends EventEmitter {

        name: string;

        counters: CallbackCounters;

        onClose?: (err?: Error) => void;

        channelClosePromise: Promise<void>;

        constructor(cache: NamedCacheClient<K, V>) {
            super();
            cache = cache;
            this.name = cache.getCacheName();
            this.counters = createNewCounter();

            const self = this;
            this.channelClosePromise = new Promise(async (resolve, reject) => {
                cache.on('closed', () => {
                    resolve();
                });
            });
        }

        mapTruncated(mapName: string): void {
            this.counters.truncate = this.counters.truncate ? this.counters.truncate + 1 : 1;
            super.emit('truncated');
        }

        mapDestroyed(mapName: string): void {
            this.counters.destroy = this.counters.destroy ? this.counters.destroy + 1 : 1;
            super.emit('destroyed');
        }

        getProperty<T, K extends keyof T>(obj: T, key: K) {
            return obj[key];  // Inferred type is T[K]
        }

        waitForChannelClose(): Promise<void> {
            return this.channelClosePromise;
        }

        resetCounters(): void {
            this.counters = createNewCounter();
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