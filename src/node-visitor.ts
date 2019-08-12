import {
    TwingBaseNodeVisitor,
    TwingNode,
    TwingNodeExpression, TwingNodeExpressionConditional,
    TwingNodeExpressionConstant,
    TwingNodeModule,
    TwingNodeType,
    TwingSource
} from "twing";
import {TwingEnvironment} from "twing/lib/environment";
import {existsSync} from "fs";

export class NodeVisitor extends TwingBaseNodeVisitor {
    private _foundTemplateNames: string[];
    private _sourceContext: TwingSource;

    get foundTemplateNames() {
        return this._foundTemplateNames;
    }

    set fromPath(fromPath: string) {
        this._sourceContext = new TwingSource('', fromPath, fromPath);
        this._foundTemplateNames = [];
    }

    protected doEnterNode(node: TwingNode, env: TwingEnvironment): TwingNode {
        return node;
    }

    protected doLeaveNode(node: TwingNode, env: TwingEnvironment): TwingNode {
        // include function
        if ((node.getType() === TwingNodeType.EXPRESSION_FUNCTION) && (node.getAttribute('name') === 'include')) {
            this.processExpressionNode(node.getNode('arguments').getNode(0), env);
        }

        // import and include tags
        if ((node.getType() === TwingNodeType.IMPORT) || (node.getType() === TwingNodeType.INCLUDE)) {
            this.processExpressionNode(node.getNode('expr'), env);
        }

        // extends and embed tags
        if ((node.getType() === TwingNodeType.MODULE) && node.hasNode('parent')) {
            this.processExpressionNode(node.getNode('parent'), env);
        }

        return node;
    }

    private processExpressionNode(node: TwingNodeExpression, env: TwingEnvironment) {
        if (node.getType() === TwingNodeType.EXPRESSION_ARRAY) {
            for (let [index, constantNode] of node.getNodes()) {
                if ((index as number) % 2) {
                    this.processExpressionNode(constantNode, env);
                }
            }
        }

        if (node.getType() === TwingNodeType.EXPRESSION_CONDITIONAL) {
            let expr2: TwingNodeExpression = node.getNode('expr2');
            let expr3: TwingNodeExpression = node.getNode('expr3');

            this.processExpressionNode(expr2, env);
            this.processExpressionNode(expr3, env);
        }

        if (node.getType() === TwingNodeType.EXPRESSION_CONSTANT) {
            node.setAttribute('value', this.pushValue(node.getAttribute('value'), env));
        }
    }

    private pushValue(value: string, env: TwingEnvironment): string {
        if (env.getLoader().exists(value, this._sourceContext)) {
            let resolvedPath: string = env.getLoader().resolve(value, this._sourceContext);

            if (existsSync(resolvedPath)) {
                if (!this._foundTemplateNames.includes(resolvedPath)) {
                    this._foundTemplateNames.push(resolvedPath);
                }

                return env.getTemplateClass(resolvedPath);
            }
        }

        return value;
    }

    getPriority(): number {
        return 0;
    }
}
