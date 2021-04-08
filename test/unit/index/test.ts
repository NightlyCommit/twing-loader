import * as tape from 'tape';
import {Test} from "tape";
import {default as loader} from "../../../src";
import {resolve as resolvePath} from "path";
import {TwingTemplate} from "twing";
import {OptionObject} from 'loader-utils';

tape('loader', (test: Test) => {
    test.test('exposes the expected dependencies', (test) => {
        const dependencies: string[] = [];

        const loaderContext: OptionObject = {
            query: {
                environmentModulePath: resolvePath('test/unit/fixtures/environment.js')
            },
            addDependency(file: string): void {
                if (!dependencies.includes(file)) {
                    dependencies.push(file);
                }
            },
            resourcePath: resolvePath('test/unit/fixtures/index.twig'),
            async: () => {
                return () => {
                    test.same(dependencies, [
                        resolvePath('test/unit/fixtures/environment.js')
                    ], 'declares the environment module as a dependency');

                    test.end();
                }
            }
        };

        loader.bind(loaderContext)('{% embed "./bar.twig" %}{% endembed %}');
    });

    test.test('handles "render at compile time" mode', (test) => {
        test.test('when everything goes fine', (test) => {
            const loaderContext: OptionObject = {
                query: {
                    environmentModulePath: resolvePath('test/unit/fixtures/environment.js'),
                    renderContext: {
                        bar: 'BAR'
                    }
                },
                addDependency(): void {},
                resourcePath: resolvePath('test/unit/fixtures/index.twig'),
                async: () => {
                    return (error: Error | undefined, value: Buffer | string) => {
                        test.same(value.toString(), 'module.exports = "    FOO\\nBAR";');

                        test.end();
                    }
                }
            };

            loader.bind(loaderContext)('{% embed "./bar.twig" %}{% endembed %}{{bar}}');
        });

        test.test('when something goes wrong', (test) => {
            const loaderContext: OptionObject = {
                query: {
                    environmentModulePath: resolvePath('test/unit/fixtures/environment.js'),
                    renderContext: {
                        bar: 'BAR'
                    }
                },
                addDependency(): void {},
                resourcePath: resolvePath('test/unit/fixtures/index.twig'),
                async: () => {
                    return (error: Error | undefined, value: Buffer | string) => {
                        test.true(error);

                        test.end();
                    }
                }
            };

            loader.bind(loaderContext)('{{ bar }');
        });
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
                const loaderContext: OptionObject = {
                    query: fixture.options,
                    addDependency(): void {},
                    resourcePath: resolvePath('test/unit/fixtures/index.twig'),
                    async: () => {}
                };

                loader.bind(loaderContext)();

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

    test.test('anonymize template names when mode is set to "production"', (test) => {
        const loaderContext: OptionObject = {
            query: {
                environmentModulePath: resolvePath('test/unit/fixtures/environment.js')
            },
            addDependency(): void {},
            resourcePath: resolvePath('test/unit/fixtures/index.twig'),
            async: () => {
                return (error: Error | undefined, value: string | Buffer) => {
                    new Function('require', `module = { exports: null };

${value}

return template;`)(require).then((template: TwingTemplate) => {
                        test.false(template.templateName.includes('test/unit/fixtures/index.twig'));

                        test.end();
                    });
                };

            },
            mode: 'production'
        };

        loader.bind(loaderContext)('foo');
    });

    test.end();
});
