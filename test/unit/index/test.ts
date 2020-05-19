import * as tape from 'tape';
import {Test} from "tape";
import {default as loader} from "../../../src";
import {resolve as resolvePath} from "path";
import {TwingTemplate} from "twing";
import {OptionObject} from 'loader-utils';
import {readFileSync} from 'fs';

tape('loader', async (test: Test) => {
    let dependencies: string[] = [];

    const loaderContext: OptionObject = {
        query: {
            environmentModulePath: resolvePath('test/unit/fixtures/environment.js')
        },
        addDependency(file: string): void {
            dependencies.push(file);
        },
        async(): CallableFunction {
            return (err: null, content: string) => {}
        },
        resourcePath: resolvePath('test/unit/fixtures/index.twig')
    };

    await loader.bind(loaderContext)('{% embed "./bar.twig" %}{% endembed %}');

    test.same(dependencies, [resolvePath('test/unit/fixtures/environment.js')], 'declares the environment module as a dependency');

    test.test('handles "render at compile time" mode', async (test) => {
        let actual: string = ''
        let renderLoaderContext: any = {
            query: {
                environmentModulePath: loaderContext.query.environmentModulePath,
                renderContext: {
                    bar: 'BAR'
                }
            },
            resourcePath: loaderContext.resourcePath,
            addDependency: loaderContext.addDependency,
            async(): CallableFunction {
                return (err: null, content: string) => {
                    actual = content
                }
            },
        };

        await loader.bind(renderLoaderContext)('{% embed "./bar.twig" %}{% endembed %}{{bar}}');

        test.same(actual, 'module.exports = "    FOO\\nBAR";');

        test.end();
    });

    test.test('provides options validation', async (test) => {
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
                await loader.bind({
                    async: loaderContext.async,
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

    test.test('anonymize template names when mode is set to "production"', async (test) => {
        let actual: string = '';
        let context: OptionObject = Object.assign({}, loaderContext, {
            mode: 'production',
            async(): CallableFunction {
                return (err: null, content: string) => {
                    actual = content
                }
            },
        });

        delete require.cache[context.query.environmentModulePath];

        await loader.bind(context)('foo')

        let template: TwingTemplate = await new Function('require', `module = { exports: null };

${actual}

return loadTemplate();`)(require);

        test.false(template.templateName.includes('test/unit/fixtures/index.twig'));

        test.end();
    });

    test.end();
});
