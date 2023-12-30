import {
    TwingLoaderInterface,
    TwingNode,
    TwingNodeExpression,
    TwingNodeExpressionArray,
    TwingNodeExpressionConditional,
    TwingNodeExpressionConstant,
    TwingNodeExpressionFunction,
    TwingNodeImport,
    TwingNodeInclude, TwingNodeModule,
    TwingSource
} from "twing";
import {existsSync} from "fs";

const slash = require('slash');

export class Visitor {
    private readonly _loader: TwingLoaderInterface;
    private readonly _from: TwingSource;
    private readonly _getTemplateHash: (s: string) => string;
    private readonly _foundTemplateNames: string[];

    constructor(loader: TwingLoaderInterface, from: string, getTemplateHash: (s: string) => string) {
        this._loader = loader;
        this._from = new TwingSource('', from, from);
        this._getTemplateHash = getTemplateHash;
        this._foundTemplateNames = [];
    }

    get foundTemplateNames(): string[] {
        return this._foundTemplateNames;
    }

    async visit(node: TwingNode): Promise<void> {
        let processExpressionNode = async (node: TwingNodeExpression): Promise<void> => {
            let pushValue = async (value: string): Promise<string> => {
                if (await this._loader.exists(value, this._from)) {
                    value = await this._loader.resolve(value, this._from);

                    if (existsSync(value)) {
                        if (!this._foundTemplateNames.includes(value)) {
                            this._foundTemplateNames.push(value);
                        }

                        value = this._getTemplateHash(slash(value));
                    }
                }

                return value;
            };

            if (node instanceof TwingNodeExpressionArray) {
                for (let [index, constantNode] of node.getNodes()) {
                    if ((index as number) % 2) {
                        await processExpressionNode(constantNode);
                    }
                }
            }

            if (node instanceof TwingNodeExpressionConditional) {
                let expr2: TwingNodeExpression = node.getNode('expr2');
                let expr3: TwingNodeExpression = node.getNode('expr3');

                await processExpressionNode(expr2);
                await processExpressionNode(expr3);
            }

            if (node instanceof TwingNodeExpressionConstant) {
                node.setAttribute('value', await pushValue(node.getAttribute('value')));
            }
        };

        // include function
        if ((node instanceof TwingNodeExpressionFunction) && (node.getAttribute('name') === 'include')) {
            await processExpressionNode(node.getNode('arguments').getNode(0));
        }

        // source function
        if ((node instanceof TwingNodeExpressionFunction) && (node.getAttribute('name') === 'source')) {
            await processExpressionNode(node.getNode('arguments').getNode(0));
        }

        // import and include tags
        if ((node instanceof TwingNodeImport) || (node instanceof TwingNodeInclude)) {
            if (node.hasNode('expr')) {
                await processExpressionNode(node.getNode('expr'));
            }
        }

        // extends and embed tags
        if ((node instanceof TwingNodeModule)) {
            if (node.hasNode('parent')) {
                await processExpressionNode(node.getNode('parent'))
            }

            for (let embeddedTemplate of node.getAttribute('embedded_templates')) {
                await this.visit(embeddedTemplate);
            }
        }

        for (let [, subNode] of node.getNodes()) {
            await this.visit(subNode);
        }
    };
}
