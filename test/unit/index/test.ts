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

tape('loader', (test: Test) => {
    let environment: TwingEnvironment = require(loaderContext.query.environmentModulePath);

    let spy = sinon.spy(environment, 'addNodeVisitor');

    loader.bind(loaderContext)('{% embed "./bar.twig" %}{% endembed %}');

    test.same(dependencies, [resolvePath('test/unit/fixtures/environment.js')], 'declares the environment module as a dependency');

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

    test.test('provides options validation', (test) => {
        type ValidationError = {
            dataPath: string,
            keyword: string,
            message: string
        };

        type Fixture = {
            options: any,
            expectation: ValidationError
        };

        let fixtures: Fixture[] = [
            {
                options: {},
                expectation: {
                    dataPath: '',
                    keyword: 'required',
                    message: 'should have required property \'environmentModulePath\''
                }
            },
            {
                options: {
                    environmentModulePath: {}
                },
                expectation: {
                    dataPath: '.environmentModulePath',
                    keyword: 'type',
                    message: 'should be string'
                }
            },
            {
                options: {
                    environmentModulePath: '',
                    renderContext: ''
                },
                expectation: {
                    dataPath: '.renderContext',
                    keyword: 'type',
                    message: 'should be object'
                }
            },
            {
                options: {
                    environmentModulePath: '',
                    foo: ''
                },
                expectation: {
                    dataPath: '',
                    keyword: 'additionalProperties',
                    message: 'should NOT have additional properties'
                }
            }
        ];

        for (let fixture of fixtures) {
            let errors: ValidationError[];

            try {
                loader.bind({
                    query: fixture.options
                })();

                errors = [];
            } catch (e) {
                errors = e.errors;
            }

            test.same(errors[0].dataPath, fixture.expectation.dataPath);
            test.same(errors[0].keyword, fixture.expectation.keyword);
            test.same(errors[0].message, fixture.expectation.message);
        }

        test.end();
    });

    test.end();
});
