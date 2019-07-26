import {readFileSync} from 'fs';
import {resolve as resolvePath, relative as relativePath} from 'path';

import * as tape from 'tape';
import {Test} from "tape";
import * as webpack from "webpack";
import {Compiler} from "webpack";
import {Configuration} from "webpack";

const MemoryFileSystem = require('memory-fs');

export abstract class TestCase {
    private readonly _dirname: string;

    constructor(dirname: string) {
        this._dirname = dirname;
    }

    get description(): string {
        return relativePath('./test/integration', this._dirname);
    };

    get expected(): string {
        return readFileSync(resolvePath(this._dirname, 'expected.txt'), 'UTF-8');
    }

    get expectedTemplateNames(): string[] {
        return [];
    }

    get unexpectedTemplateNames(): string[] {
        return [];
    }

    private compile(configuration: Configuration, moduleOnly: boolean = false): Promise<string> {
        return new Promise((resolve, reject) => {
            const compiler: Compiler = webpack(configuration);

            let memoryFs = new MemoryFileSystem();

            compiler.outputFileSystem = memoryFs;

            compiler.run((err, stats) => {
                if (err || stats.hasErrors()) {
                    if (err) {
                        reject(err);
                    } else {
                        reject(new Error(stats.toJson("errors-only").errors.join('')));
                    }
                } else {
                    let actual: string;

                    if (moduleOnly) {
                        actual = stats.toJson().modules[0].source;
                    } else {
                        actual = new Function(`return ${memoryFs.readFileSync(resolvePath('dist/main.js'))};`)();
                    }

                    resolve(actual);
                }
            });
        });
    }

    run(): void {
        let configuration: Configuration = {
            entry: resolvePath(this._dirname, 'index.js'),
            mode: 'none',
            module: {
                rules: [
                    {
                        test: /\.twig$/,
                        use: [
                            {
                                loader: require.resolve('../../dist/index.js'),
                                options: {
                                    environment_module_path: resolvePath(this._dirname, './environment.js'),
                                }
                            }
                        ]
                    }
                ]
            }
        };

        tape(this.description, (test: Test) => {
            return this.compile(configuration)
                .then((actual) => {
                    test.same(actual, this.expected, 'bundle is valid');

                    if (this.expectedTemplateNames.length || this.unexpectedTemplateNames.length) {
                        configuration.entry = resolvePath(this._dirname, 'index.twig');

                        return this.compile(configuration, true)
                            .then((actual) => {
                                let getMatches = (templateName: string) => {
                                    let regExp = new RegExp(`require\\('${resolvePath(this._dirname, templateName)}'\\);`, 'g');

                                    return actual.match(regExp);
                                };

                                for (let templateName of this.expectedTemplateNames) {
                                    let matches = getMatches(templateName);

                                    if (matches) {
                                        test.same(matches.length, 1, `"${templateName}" is required once`);
                                    } else {
                                        test.fail(`"${templateName}" should be required`);
                                    }
                                }

                                for (let templateName of this.unexpectedTemplateNames) {
                                    let matches = getMatches(templateName);

                                    if (matches) {
                                        test.fail(`"${templateName}" should not be required`);
                                    } else {
                                        test.pass(`"${templateName}" is not required`);
                                    }
                                }
                            })
                    }
                })
                .catch((err) => {
                    test.fail(err.message);
                })
                .finally(() => {
                    test.end();
                });
        });
    }
}
