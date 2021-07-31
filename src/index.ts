import {getOptions} from 'loader-utils';
import {loader} from 'webpack';
import {
    TwingEnvironment,
    TwingLoaderArray,
    TwingLoaderChain,
    TwingNodeModule,
    TwingSource, TwingTokenStream
} from 'twing';
import {Visitor} from "./visitor";

const sha256 = require('crypto-js/sha256');
const hex = require('crypto-js/enc-hex');
const slash = require('slash');
const path = require('path');

const validateOptions = require('schema-utils');

const optionsSchema = {
    type: 'object',
    properties: {
        environmentModulePath: {
            type: 'string'
        },
        renderContext: {
            type: 'object'
        },
        withHTMLComments: {
            type: 'boolean'
        }
    },
    required: [
        'environmentModulePath'
    ],
    additionalProperties: false
};

class PathSupportingArrayLoader extends TwingLoaderArray {
    getSourceContext(name: string, from: TwingSource): Promise<TwingSource> {
        return super.getSourceContext(name, from).then((source) => {
            return new TwingSource(source.getCode(), source.getName(), name);
        });
    }
}

export default function (this: loader.LoaderContext, source: string) {
    const callback = this.async();

    const getTemplateHash = (name: string) => {
        return this.mode !== 'production' ? name : hex.stringify(sha256(name));
    };

    const options = getOptions(this);

    validateOptions(optionsSchema, options, 'Twing loader');

    delete require.cache[options.environmentModulePath];

    let resourcePath: string = slash(this.resourcePath);
    let environmentModulePath: string = options.environmentModulePath;
    let renderContext: any = options.renderContext;
    let withHTMLComments: boolean = options.withHTMLComments;

    if (withHTMLComments) {
        const relativePath = path.relative(process.cwd(), resourcePath);
        source = `<!-- START: ${relativePath} -->\n${source || ''}\n<!-- END: ${relativePath} -->`;
    }

    this.addDependency(slash(environmentModulePath));

    // require takes module name separated with forward slashes
    let environment: TwingEnvironment = require(slash(environmentModulePath));
    let loader = environment.getLoader();

    if (renderContext === undefined) {
        let parts: string[] = [
            `const env = require('${slash(environmentModulePath)}');`
        ];

        let key = getTemplateHash(resourcePath);
        let sourceContext: TwingSource = new TwingSource(source, `${key}`);
        let tokenStream: TwingTokenStream = environment.tokenize(sourceContext);

        let module: TwingNodeModule = environment.parse(tokenStream);

        let visitor = new Visitor(loader, resourcePath, getTemplateHash);

        visitor.visit(module).then(() => {
            let precompiledTemplate = environment.compile(module);

            parts.push(`let templatesModule = (() => {
let module = {
    exports: undefined
};

${precompiledTemplate}

    return module.exports;
})();
`);

            for (let foundTemplateName of visitor.foundTemplateNames) {
                // require takes module name separated with forward slashes
                parts.push(`require('${slash(foundTemplateName)}');`);
            }

            parts.push(`env.registerTemplatesModule(templatesModule, '${key}');`);

            parts.push(`
let template = env.loadTemplate('${key}');

module.exports = (context = {}) => {
    return template.then((template) => template.render(context));
};`);

            callback(null, parts.join('\n'));
        });
    } else {
        environment.setLoader(new TwingLoaderChain([
            new PathSupportingArrayLoader(new Map([
                [resourcePath, source]
            ])),
            loader
        ]));

        environment.on('template', async (name: string, from: TwingSource) => {
            this.addDependency(await environment.getLoader().resolve(name, from));
        });

        environment.render(resourcePath, renderContext).then((result) => {
            callback(null, `module.exports = ${JSON.stringify(result)};`);
        }).catch((error) => {
            callback(error);
        });
    }
};
