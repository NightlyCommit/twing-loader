import * as tape from 'tape';
import {Test} from "tape";
import {default as loader} from "../../../src";
import {resolve as resolvePath} from "path";
import * as sinon from "sinon";
import {TwingEnvironment} from "twing/lib/environment";

let dependencies: string[] = [];

const loaderContext = {
    query: {
        environment_module_path: resolvePath('test/unit/fixtures/environment.js'),
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
    let environment: TwingEnvironment = require(loaderContext.query.environment_module_path);

    let spy = sinon.spy(environment, 'addNodeVisitor');

    let actual: string = loader.bind(loaderContext)('');

    test.same(dependencies, [resolvePath('test/unit/fixtures/environment.js')], 'declares the environment module as a dependency');

    let pattern =
        escapePattern(`const {cache, loader, getEnvironment} = require('${resolvePath('src/runtime.ts')}');
const env = getEnvironment(require('${resolvePath('test/unit/fixtures/environment.js')}'));
cache.write('__TwingTemplate_2ae10e02f254cb92d52ed04e6cfe67cf423464bf7dfe6f79b62124f7906eccfe', (() => {let module = {
    exports: undefined
};

`)
        + '(.*)'
        + escapePattern(`

return module.exports;})());

loader.addTemplateKey('${resolvePath('test/unit/fixtures/index.twig')}', '__TwingTemplate_2ae10e02f254cb92d52ed04e6cfe67cf423464bf7dfe6f79b62124f7906eccfe');
require('${resolvePath('test/unit/fixtures/bar.twig')}');

let template = env.loadTemplate('${resolvePath('test/unit/fixtures/index.twig')}');

module.exports = function(context = {}) {
    return template.render(context);
};`);

    test.true(actual.match(new RegExp(pattern, 's')), 'outputs a valid module');

    loader.bind(loaderContext)('');

    test.true(spy.calledOnce, 'adds the node visitor only once');

    test.end();
});
