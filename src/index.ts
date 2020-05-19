import {getOptions} from 'loader-utils';
import {loader} from 'webpack';
import {
    TwingEnvironment,
    TwingLoaderArray,
    TwingLoaderChain,
    TwingNodeModule,
    TwingSource, TwingTokenStream
} from 'twing';
import {Visitor} from './visitor';

const sha256 = require('crypto-js/sha256');
const hex = require('crypto-js/enc-hex');
const slash = require('slash');

const validateOptions = require('schema-utils');

const optionsSchema = {
    type: 'object',
    properties: {
        environmentModulePath: {
            type: 'string'
        },
        renderContext: {
            type: 'object'
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
        })
    }
}

export default async function (this: loader.LoaderContext, source: string) {
    const callback = this.async();

    const getTemplateHash = (name: string) => {
        return this.mode !== 'production' ? name : hex.stringify(sha256(name));
    };

    const options = getOptions(this);

    validateOptions(optionsSchema, options, 'Twing loader');

    let resourcePath: string = slash(this.resourcePath);
    let environmentModulePath: string = options.environmentModulePath;
    let renderContext: any = options.renderContext;

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

        await visitor.visit(module);

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
let loadTemplate = () => env.loadTemplate('${key}');

module.exports = (context = {}) => {
    return loadTemplate().then((template) => template.render(context));
};`);

        callback(null, parts.join('\n'));
    } else {
        environment.setLoader(new TwingLoaderChain([
            new PathSupportingArrayLoader(new Map([
                [resourcePath, source]
            ])),
            loader
        ]));

        environment.on('template', (name: string, from: TwingSource) => {
            environment.getLoader().resolve(name, from)
              .then((path) => this.addDependency(path))
              .catch((e) => {});
        });

        callback(null, `module.exports = ${JSON.stringify(await environment.render(resourcePath, renderContext))};`);
    }
};
