import {TestCase} from "../../test-case";
import {Test} from "tape";
import {resolve as resolvePath} from "path";
import MemoryFileSystem = require("memory-fs");
import {TestSuite} from "../../test-suite";

const HtmlWebpackPlugin = require('html-webpack-plugin');

class HtmlWebpackPluginTestCase extends TestCase {
    get configuration() {
        let configuration = super.configuration;

        configuration.plugins = [
            new HtmlWebpackPlugin({
                template: resolvePath(__dirname, 'index.twig'),
                templateParameters: {
                    foo: 'BAR'
                },
                minify: false
            })
        ];

        return configuration;
    }

    get entry() {
        return __dirname + '/entry.js';
    }

    get expected() {
        return `FOO`;
    }

    get expectedFromPlugin() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>BAR</title>
</head>
<body>
<script type="text/javascript" src="main.js"></script></body>
</html>
`;
    }

    protected doTest(test: Test,  message: string, memoryFs: MemoryFileSystem): Promise<void> {
        return super.doTest(test, message, memoryFs).then(() => {
            let actual = memoryFs.readFileSync(resolvePath('dist/index.html'), 'UTF-8');

            test.same(actual, this.expectedFromPlugin, 'plugin output is valid');
        });
    }
}

(new TestSuite('coupled with HtmlWebpackPlugin', [
    new HtmlWebpackPluginTestCase(),
    new HtmlWebpackPluginTestCase({
        foo: 'BAR'
    })
])).run();
