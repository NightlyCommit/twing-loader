import * as tape from 'tape';
import {Test} from "tape";
import {
    TwingLoaderArray,
    TwingLoaderRelativeFilesystem,
    TwingNode, TwingNodeExpressionArray, TwingNodeExpressionConditional,
    TwingNodeExpressionConstant,
    TwingNodeExpressionFunction, TwingNodeImport, TwingNodeInclude, TwingNodeModule, TwingSource
} from "twing";
import {TwingEnvironmentNode} from "twing/lib/environment/node";
import {resolve as resolvePath} from "path";
import {NodeVisitor} from "../../../src/node-visitor";

const getEntryPath = (): string => {
    return resolvePath('test/unit/fixtures/foo.twig');
};

class CustomEnvironemt extends TwingEnvironmentNode {
    getTemplateClass(name: string, index?: number, from?: TwingSource): string {
        return `RESOLVED::${name}`;
    }
}

const getEnvironment = (): CustomEnvironemt => {
    return new CustomEnvironemt(new TwingLoaderRelativeFilesystem());
};

tape('node-visitor', (test: Test) => {
    const visitor = new NodeVisitor();

    test.test('enterNode', (test: Test) => {
        let node = new TwingNodeExpressionFunction('include', new TwingNode(new Map([
            [0, new TwingNodeExpressionConstant('./bar.twig', 1, 1)]
        ])), 1);

        visitor.fromPath = getEntryPath();
        visitor.enterNode(node, getEnvironment());

        test.same(visitor.foundTemplateNames, [], 'doesn\'t resolve template names');

        test.end();
    });

    test.test('getPriority', (test: Test) => {
        test.same(visitor.getPriority(), 0);

        test.end();
    });

    test.test('leaveNode', (test: Test) => {
        test.test('handles include function', (test: Test) => {
            let node = new TwingNodeExpressionFunction('include', new TwingNode(new Map([
                [0, new TwingNodeExpressionConstant('./bar.twig', 1, 1)]
            ])), 1);

            visitor.fromPath = getEntryPath();
            visitor.leaveNode(node, getEnvironment());

            test.same(visitor.foundTemplateNames, [
                resolvePath('test/unit/fixtures/bar.twig')
            ], 'template names are valid');
            test.same(node.getNode('arguments').getNode(0).getAttribute('value'), 'RESOLVED::' + resolvePath('test/unit/fixtures/bar.twig'), 'expression path is resolved');

            test.end();
        });

        test.test('handles import tag', (test: Test) => {
            let node = new TwingNodeImport(new TwingNodeExpressionConstant('./bar.twig', 1, 1), null, 1, 1);

            visitor.fromPath = getEntryPath();
            visitor.leaveNode(node, getEnvironment());

            test.same(visitor.foundTemplateNames, [
                resolvePath('test/unit/fixtures/bar.twig')
            ], 'template names are valid');
            test.same(node.getNode('expr').getAttribute('value'), 'RESOLVED::' + resolvePath('test/unit/fixtures/bar.twig'), 'expression path is resolved');

            node = new TwingNodeImport(new TwingNodeExpressionArray(new Map([
                ['0', new TwingNode()],
                ['1', new TwingNodeExpressionConstant('./bar.twig', 1, 1)],
                ['2', new TwingNode()],
                ['3', new TwingNodeExpressionConstant('./lorem.twig', 1, 1)]
            ]), 1, 1), null, 1, 1);

            visitor.leaveNode(node, getEnvironment());

            test.same(visitor.foundTemplateNames, [
                resolvePath('test/unit/fixtures/bar.twig'),
                resolvePath('test/unit/fixtures/lorem.twig')
            ], 'template names are valid');

            node = new TwingNodeImport(new TwingNodeExpressionConditional(
                new TwingNode(),
                new TwingNodeExpressionConstant('./bar.twig', 1, 1),
                new TwingNodeExpressionConstant('./lorem.twig', 1, 1),
                1, 1
            ), null, 1, 1);

            visitor.leaveNode(node, getEnvironment());

            test.same(visitor.foundTemplateNames, [
                resolvePath('test/unit/fixtures/bar.twig'),
                resolvePath('test/unit/fixtures/lorem.twig')
            ], 'template names are valid');
            test.same(node.getNode('expr').getNode('expr2').getAttribute('value'), 'RESOLVED::' + resolvePath('test/unit/fixtures/bar.twig'), 'expression 2 path is resolved');
            test.same(node.getNode('expr').getNode('expr3').getAttribute('value'), 'RESOLVED::' + resolvePath('test/unit/fixtures/lorem.twig'), 'expression 3 path is resolved');

            test.end();
        });

        test.test('handles include tag', (test: Test) => {
            let node = new TwingNodeInclude(new TwingNodeExpressionConstant('./bar.twig', 1, 1), null, false, false, 1, 1);

            visitor.fromPath = getEntryPath();
            visitor.leaveNode(node, getEnvironment());

            test.same(visitor.foundTemplateNames, [
                resolvePath('test/unit/fixtures/bar.twig')
            ], 'template names are valid');
            test.same(node.getNode('expr').getAttribute('value'), 'RESOLVED::' + resolvePath('test/unit/fixtures/bar.twig'), 'expression path is resolved');

            node = new TwingNodeInclude(new TwingNodeExpressionArray(new Map([
                ['0', new TwingNode()],
                ['1', new TwingNodeExpressionConstant('./bar.twig', 1, 1)],
                ['2', new TwingNode()],
                ['3', new TwingNodeExpressionConstant('./lorem.twig', 1, 1)]
            ]), 1, 1), null, false, false, 1, 1);

            visitor.leaveNode(node, getEnvironment());

            test.same(visitor.foundTemplateNames, [
                resolvePath('test/unit/fixtures/bar.twig'),
                resolvePath('test/unit/fixtures/lorem.twig')
            ], 'template names are valid');

            node = new TwingNodeInclude(new TwingNodeExpressionConditional(
                new TwingNode(),
                new TwingNodeExpressionConstant('./bar.twig', 1, 1),
                new TwingNodeExpressionConstant('./lorem.twig', 1, 1),
                1, 1), null, false, false, 1, 1);

            visitor.leaveNode(node, getEnvironment());

            test.same(visitor.foundTemplateNames, [
                resolvePath('test/unit/fixtures/bar.twig'),
                resolvePath('test/unit/fixtures/lorem.twig')
            ], 'template names are valid');
            test.same(node.getNode('expr').getNode('expr2').getAttribute('value'), 'RESOLVED::' + resolvePath('test/unit/fixtures/bar.twig'), 'expression 2 path is resolved');
            test.same(node.getNode('expr').getNode('expr3').getAttribute('value'), 'RESOLVED::' + resolvePath('test/unit/fixtures/lorem.twig'), 'expression 3 path is resolved');

            test.end();
        });

        test.test('handles module with parent', (test: Test) => {
            let node = new TwingNodeModule(new TwingNode(), new TwingNodeExpressionConstant('./bar.twig', 1, 1), new TwingNode(), new TwingNode(), new TwingNode(), [], new TwingSource('', 'foo', getEntryPath()));

            visitor.fromPath = getEntryPath();
            visitor.leaveNode(node, getEnvironment());

            test.same(visitor.foundTemplateNames, [resolvePath('test/unit/fixtures/bar.twig')], 'template names are valid');
            test.same(node.getNode('parent').getAttribute('value'), 'RESOLVED::' + resolvePath('test/unit/fixtures/bar.twig'), 'expression path is resolved');

            test.end();
        });

        test.test('ignore missing templates', (test: Test) => {
            let environment = getEnvironment();

            let node = new TwingNodeExpressionFunction('include', new TwingNode(new Map([
                [0, new TwingNodeExpressionConstant('./bare.twig', 1, 1)]
            ])), 1);

            visitor.fromPath = getEntryPath();
            visitor.leaveNode(node, environment);

            test.same(visitor.foundTemplateNames, []);

            environment.setLoader(new TwingLoaderArray({
                bar: 'BAR'
            }));

            node = new TwingNodeExpressionFunction('include', new TwingNode(new Map([
                [0, new TwingNodeExpressionConstant('bar', 1, 1)]
            ])), 1);

            visitor.fromPath = getEntryPath();
            visitor.leaveNode(node, environment);

            test.same(visitor.foundTemplateNames, []);

            test.end();
        });

        let node = new TwingNodeExpressionFunction('include', new TwingNode(new Map([
            [0, new TwingNodeExpressionConstant('./bar.twig', 1, 1)]
        ])), 1);

        visitor.leaveNode(node, getEnvironment());

        node = new TwingNodeExpressionFunction('include', new TwingNode(new Map([
            [0, new TwingNodeExpressionConstant('./lorem.twig', 1, 1)]
        ])), 1);

        visitor.leaveNode(node, getEnvironment());

        test.same(visitor.foundTemplateNames, [
            resolvePath('test/unit/fixtures/bar.twig'),
            resolvePath('test/unit/fixtures/lorem.twig')
        ], 'preserves found templates list across calls');

        visitor.fromPath = getEntryPath();

        node = new TwingNodeExpressionFunction('include', new TwingNode(new Map([
            [0, new TwingNodeExpressionConstant('./lorem.twig', 1, 1)]
        ])), 1);

        visitor.leaveNode(node, getEnvironment());

        test.same(visitor.foundTemplateNames, [
            resolvePath('test/unit/fixtures/lorem.twig')
        ], 'except when fromPath is updated');

        test.end();
    });

    test.end();
});
