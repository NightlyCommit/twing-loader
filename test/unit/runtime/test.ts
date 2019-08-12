import * as tape from 'tape';
import {Test} from "tape";
import {cache, loader, getEnvironment} from "../../../src/runtime";
import {TwingEnvironmentNode} from "twing/lib/environment/node";
import {TwingLoaderArray} from "twing";

tape('runtime', (test: Test) => {
    test.test('cache', (test: Test) => {
        test.same(cache.generateKey('foo', 'bar'), 'bar');
        test.same(cache.load('bar')({}), {});

        cache.write('foo', 'module.exports = "bar";');

        test.same(cache.load('foo')({}), 'bar');

        cache.write('foo', () => {
            return 'bar';
        });

        test.same(cache.load('foo')({}), 'bar');
        test.same(cache.getTimestamp('foo'), null);

        test.end();
    });

    test.test('loader', (test: Test) => {
        test.same(loader.exists('foo'), false);

        loader.addTemplateKey('foo', 'bar');
        test.same(loader.exists('foo'), true);
        test.same(loader.getCacheKey('foo'), 'foo');

        test.end();
    });

    test.test('getEnvironment', (test: Test) => {
        loader.addTemplateKey('foo', 'bar');

        let env = getEnvironment(new TwingEnvironmentNode(new TwingLoaderArray({})));

        test.true(env.getLoader().exists('foo', null));
        test.same(env.getCache(), cache);

        let env2 = getEnvironment(new TwingEnvironmentNode(new TwingLoaderArray({})));

        test.same(env, env2);

        test.same(env.getTemplateClass('foo'), 'foo');

        test.end();
    });

    test.end();
});
