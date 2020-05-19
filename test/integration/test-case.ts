import {resolve as resolvePath, relative as relativePath} from 'path';

import {Test} from "tape";
import * as webpack from "webpack";
import {Compiler, Stats} from "webpack";
import {Configuration} from "webpack";
import MemoryFileSystem = require("memory-fs");

let moduleKey: string = require.resolve('../../dist/index.js');

export abstract class TestCase {
    private readonly _renderContext: any;

    constructor(renderContext: any = undefined) {
        this._renderContext = renderContext;
    }

    abstract get expected(): string;

    get renderContext(): any {
        return this._renderContext;
    }

    get environmentModulePath(): string {
        return 'test/integration/environment.js';
    }

    abstract get entry(): string;

    get configuration(): Configuration {
        return {
            entry: resolvePath(this.entry),
            mode: 'none',
            module: {
                rules: [
                    {
                        test: /\.twig$/,
                        use: [
                            {
                                loader: moduleKey,
                                options: {
                                    environmentModulePath: resolvePath(this.environmentModulePath),
                                    renderContext: this.renderContext
                                }
                            }
                        ]
                    }
                ]
            }
        };
    }

    protected compile(configuration: Configuration, test: Test = null): Promise<MemoryFileSystem> {
        return new Promise((resolve, reject) => {
            const compiler: Compiler = webpack(configuration);

            let memoryFs = new MemoryFileSystem();

            compiler.outputFileSystem = memoryFs;

            compiler.run((err, stats) => {
                if (err) {
                    return reject(err);
                }

                if (stats.hasErrors()) {
                    return reject(new Error(stats.toJson("errors-only").errors.join('')));
                }

                resolve(memoryFs);
            });
        });
    }

    run(test: Test): Promise<void> {
        let configuration: Configuration = this.configuration;

        delete require.cache[moduleKey];

        return this.compile(configuration, test)
            .then((memoryFs: MemoryFileSystem) => {
                return new Promise<void>((resolve) =>
                  resolve(this.doTest(
                    test,
                    this.renderContext ? 'using "render at compile time" behavior' : 'using "render at runtime" behavior',
                    memoryFs
                  ))
                );
            })
            .catch((err) => {
                test.fail(err.message);
            });
    }

    protected doTest(test: Test, message: string, memoryFs: MemoryFileSystem): void|Promise<void> {
        let result: string|Promise<string>;
        const source = memoryFs.readFileSync(resolvePath('dist/main.js'), 'UTF-8');

        result = new Function(`return ${source};`)()
        if (result instanceof Promise) {
            return result.then((code: string) => test.same(code, this.expected, message));
        } else {
            test.same(result, this.expected, message);
        }
    }
}
