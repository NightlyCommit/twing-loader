import {getOptions} from 'loader-utils';
import {loader} from 'webpack';
import {TwingEnvironment, TwingSource} from 'twing';
import {NodeVisitor} from "./node-visitor";

const validateOptions = require('schema-utils');

let environment: TwingEnvironment;
let nodeVisitor: NodeVisitor;

const optionsSchema = {
    type: 'object',
    properties: {
        environment_module_path: {
            type: 'string'
        }
    }
};

const loader = function (this: loader.LoaderContext, source: string) {
    const options = getOptions(this);

    validateOptions(optionsSchema, options, 'Twing loader');

    let environmentModulePath: string = options.environment_module_path;

    if (!environment) {
        environment = require(environmentModulePath);
        nodeVisitor = new NodeVisitor();

        environment.addNodeVisitor(nodeVisitor);
    }

    this.addDependency(environmentModulePath);

    let parts = [
        `const {cache, loader, getEnvironment} = require('${require.resolve('./runtime')}');`,
        `const env = getEnvironment(require('${environmentModulePath}'));`
    ];

    let name: string = this.resourcePath;
    let sourceContext: TwingSource = environment.getLoader().getSourceContext(name, null);

    nodeVisitor.sourceContext = sourceContext;

    let precompiledTemplate = environment.compile(environment.parse(environment.tokenize(sourceContext)));
    let className = environment.getTemplateClass(name);

    parts.push(`cache.write('${className}', (() => {let module = {
    exports: undefined
};

${precompiledTemplate}

return module.exports;})());
`);
    parts.push(`loader.addTemplateKey('${name}', '${className}');`);

    for (let foundTemplateName of nodeVisitor.foundTemplateNames) {
        parts.push(`require('${foundTemplateName}');`);
    }

    parts.push(`
let template = env.loadTemplate('${this.resourcePath}');

module.exports = function(context = {}) {
    return template.render(context);
};`);

    return parts.join('\n');
};

export default loader;
