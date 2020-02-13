import { expect } from "chai";
import { SessionBuilder } from "../src/cache/session";

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

    // @test
    // async shouldCreateCacheWithInvalidAddress() {
    //     const sess = new SessionBuilder()
    //         .withAddress('abc.xyz.com:9877').build();
    //     const cache = sess.getCache('sess-test');
    //     await cache.put('a', 'abc');
    //     expect(await cache.size()).to.equal(1);
    //     await sess.close();

    //     expect(sess.isClosed()).to.equal(true);
    // }

}

