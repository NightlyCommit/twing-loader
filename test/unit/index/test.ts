import * as tape from 'tape';
import {Test} from "tape";
import {default as loader} from "../../../src";
import {resolve as resolvePath} from "path";
import * as sinon from "sinon";
import {TwingEnvironment} from "twing/lib/environment";

let dependencies: string[] = [];

const loaderContext = {
    query: {
        environmentModulePath: resolvePath('test/unit/fixtures/environment.js')
    },
    addDependency(file: string): void {
        dependencies.push(file);
    },
    resourcePath: resolvePath('test/unit/fixtures/index.twig')
};

const escapePattern = (pattern: string): string => {
    return pattern.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
};

tape('loader', (test: Test) => {
    let environment: TwingEnvironment = require(loaderContext.query.environmentModulePath);

    let spy = sinon.spy(environment, 'addNodeVisitor');

    let actual: string = loader.bind(loaderContext)('{% embed "./bar.twig" %}{% endembed %}');

    test.same(dependencies, [resolvePath('test/unit/fixtures/environment.js')], 'declares the environment module as a dependency');

    let pattern =
        escapePattern(`const {cache, loader, getEnvironment} = require('${resolvePath('src/runtime.ts')}');
const env = getEnvironment(require('${resolvePath('test/unit/fixtures/environment.js')}'));
cache.write('`)
        + '__HASHED__(.*)'
        + escapePattern(`', (() => {let module = {
    exports: undefined
};

`)
        + '(.*)'
        + escapePattern(`

return module.exports;})());

loader.addTemplateKey('`)
        + '__HASHED__(.*)\', \'__HASHED__(.*)'
        + escapePattern(`');
require('${resolvePath('test/unit/fixtures/bar.twig')}');

let template = env.loadTemplate('`)
        + '__HASHED__(.*)'
        + escapePattern(`');

module.exports = function(context = {}) {
    return template.render(context);
};`);

    test.true(actual.match(new RegExp(pattern, 's')), 'outputs a valid module');

    loader.bind(loaderContext)('');

    test.true(spy.notCalled, 'doesn\'t pollute the environment outside of the loader');

    test.test('handles "render at compile time" mode', (test) => {
        let renderLoaderContext: any = {
            query: {
                environmentModulePath: loaderContext.query.environmentModulePath,
                renderContext: {
                    bar: 'BAR'
                }
            },
            resourcePath: loaderContext.resourcePath,
            addDependency: loaderContext.addDependency
        };

        let actual: string = loader.bind(renderLoaderContext)('{% embed "./bar.twig" %}{% endembed %}{{bar}}');

        test.same(actual, 'module.exports = "    FOO\\nBAR";');

        test.end();
    });

    test.end();
});
