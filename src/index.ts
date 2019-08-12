import {getOptions} from 'loader-utils';
import {loader} from 'webpack';
import {TwingEnvironment, TwingLoaderArray, TwingLoaderChain, TwingSource} from 'twing';
import {NodeVisitor} from "./node-visitor";

const sha256 = require('crypto-js/sha256');
const hex = require('crypto-js/enc-hex');

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
    ]
};

class PathSupportingArrayLoader extends TwingLoaderArray {
    getSourceContext(name: string): TwingSource {
        let source = super.getSourceContext(name);

        return new TwingSource(source.getCode(), source.getName(), name);
    }
}

export default function (this: loader.LoaderContext, source: string) {
    const options = getOptions(this);

    validateOptions(optionsSchema, options, 'Twing loader');

    let environmentModulePath: string = options.environmentModulePath;
    let renderContext: any = options.renderContext;

    this.addDependency(environmentModulePath);

    // we don't want to reuse an eventual initialized environment
    delete require.cache[require.resolve(environmentModulePath)];

    let environment: TwingEnvironment = require(environmentModulePath);

    if (renderContext === undefined) {
        let parts: string[] = [
            `const {cache, loader, getEnvironment} = require('${require.resolve('./runtime')}');`,
            `const env = getEnvironment(require('${environmentModulePath}'));`
        ];

        let nodeVisitor: NodeVisitor;

        nodeVisitor = new NodeVisitor();
        nodeVisitor.fromPath = this.resourcePath;

        environment.addNodeVisitor(nodeVisitor);

        Reflect.set(environment, 'getTemplateClass', function (name: string, index: number = null, from: TwingSource = null) {
            let hash: string;

            const HASH_PREFIX = '__HASHED__';

            if (name.startsWith(HASH_PREFIX)) {
                hash = name;
            } else {
                hash = `${HASH_PREFIX}${hex.stringify(sha256(name))}`;
            }

            return hash + (index === null ? '' : '_' + index);
        });

        let className: string = environment.getTemplateClass(this.resourcePath);
        let sourceContext: TwingSource = new TwingSource(source, className);
        let precompiledTemplate = environment.compile(environment.parse(environment.tokenize(sourceContext)));

        parts.push(`cache.write('${className}', (() => {let module = {
    exports: undefined
};

${precompiledTemplate}

return module.exports;})());
`);
        parts.push(`loader.addTemplateKey('${className}', '${className}');`);

        for (let foundTemplateName of nodeVisitor.foundTemplateNames) {
            parts.push(`require('${foundTemplateName}');`);
        }

        parts.push(`
let template = env.loadTemplate('${className}');

module.exports = function(context = {}) {
    return template.render(context);
};`);

        return parts.join('\n');
    } else {
        environment.setLoader(new TwingLoaderChain([
            new PathSupportingArrayLoader(new Map([
                [this.resourcePath, source]
            ])),
            environment.getLoader()
        ]));

        environment.on('template', (name: string, from: TwingSource) => {
            this.addDependency(environment.getLoader().resolve(name, from));
        });

        return `module.exports = ${JSON.stringify(environment.render(this.resourcePath, renderContext))};`;
    }
};
