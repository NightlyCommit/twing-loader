import {TwingLoaderInterface, TwingNode, TwingNodeExpression, TwingNodeType, TwingSource} from "twing";
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

    visit(node: TwingNode) {
        let processExpressionNode = (node: TwingNodeExpression) => {
            let pushValue = (value: string): string => {
                if (this._loader.exists(value, this._from)) {
                    value = this._loader.resolve(value, this._from);

                    if (existsSync(value)) {
                        if (!this._foundTemplateNames.includes(value)) {
                            this._foundTemplateNames.push(value);
                        }

                        value = this._getTemplateHash(slash(value));
                    }
                }

                return value;
            };

            if (node.getType() === TwingNodeType.EXPRESSION_ARRAY) {
                for (let [index, constantNode] of node.getNodes()) {
                    if ((index as number) % 2) {
                        processExpressionNode(constantNode);
                    }
                }
            }

            if (node.getType() === TwingNodeType.EXPRESSION_CONDITIONAL) {
                let expr2: TwingNodeExpression = node.getNode('expr2');
                let expr3: TwingNodeExpression = node.getNode('expr3');

                processExpressionNode(expr2);
                processExpressionNode(expr3);
            }

            if (node.getType() === TwingNodeType.EXPRESSION_CONSTANT) {
                node.setAttribute('value', pushValue(node.getAttribute('value')));
            }
        };

        // include function
        if ((node.getType() === TwingNodeType.EXPRESSION_FUNCTION) && (node.getAttribute('name') === 'include')) {
            processExpressionNode(node.getNode('arguments').getNode(0));
        }

        // import and include tags
        if ((node.getType() === TwingNodeType.IMPORT) || (node.getType() === TwingNodeType.INCLUDE)) {
            if (node.hasNode('expr')) {
                processExpressionNode(node.getNode('expr'));
            }
        }

        // extends and embed tags
        if ((node.getType() === TwingNodeType.MODULE)) {
            if (node.hasNode('parent')) {
                processExpressionNode(node.getNode('parent'))
            }

            for (let embeddedTemplate of node.getAttribute('embedded_templates')) {
                this.visit(embeddedTemplate);
            }
        }

        for (let [key, subNode] of node.getNodes()) {
            this.visit(subNode);
        }
    };
}
