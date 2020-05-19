import * as tape from 'tape';
import {Test} from "tape";
import {
    TwingLoaderArray,
    TwingLoaderRelativeFilesystem,
    TwingNode, TwingNodeExpressionArray, TwingNodeExpressionConditional,
    TwingNodeExpressionConstant,
    TwingNodeExpressionFunction, TwingNodeImport, TwingNodeInclude, TwingNodeModule, TwingSource,
    TwingEnvironment, TwingNodeBody
} from "twing";
import {resolve as resolvePath} from "path";
import {Visitor} from "../../../src/visitor";

const getEntryPath = (): string => {
    return resolvePath('test/unit/fixtures/foo.twig');
};

tape('visitor', (test: Test) => {
    const visit = async (node: TwingNode, environment: TwingEnvironment = null): Promise<string[]> => {
        const env = environment || new TwingEnvironment(new TwingLoaderRelativeFilesystem());
        const visitor = new Visitor(env.getLoader(), getEntryPath(), (name: string) => 'HASHED::' + name);

        await visitor.visit(node);

        return visitor.foundTemplateNames;
    };

    test.test('handles include function', async (test: Test) => {
        let node = new TwingNodeExpressionFunction('include', new TwingNode(new Map([
            [0, new TwingNodeExpressionConstant('./bar.twig', 1, 1)]
        ])), 1, 1);

        test.same(await visit(node), [
            resolvePath('test/unit/fixtures/bar.twig')
        ]);

        node = new TwingNodeExpressionFunction('include', new TwingNode(new Map([
            [0, new TwingNodeExpressionArray(new Map([
                ['0', new TwingNode()],
                ['1', new TwingNodeExpressionConstant('./lorem.twig', 1, 1)],
                ['2', new TwingNode()],
                ['3', new TwingNodeExpressionConstant('./bar.twig', 1, 1)],
            ]), 1, 1)]
        ])), 1, 1);

        test.same(await visit(node), [
            resolvePath('test/unit/fixtures/lorem.twig'),
            resolvePath('test/unit/fixtures/bar.twig')
        ]);

        test.end();
    });

    test.test('handles import tag', async (test: Test) => {
        let node = new TwingNodeImport(new TwingNodeExpressionConstant('./bar.twig', 1, 1), new TwingNode(), 1, 1);

        test.same(await visit(node), [
            resolvePath('test/unit/fixtures/bar.twig')
        ], 'template names are valid');
        test.same(node.getNode('expr').getAttribute('value'), 'HASHED::' + resolvePath('test/unit/fixtures/bar.twig'), 'expression path is resolved');

        node = new TwingNodeImport(new TwingNodeExpressionArray(new Map([
            ['0', new TwingNode()],
            ['1', new TwingNodeExpressionConstant('./bar.twig', 1, 1)],
            ['2', new TwingNode()],
            ['3', new TwingNodeExpressionConstant('./lorem.twig', 1, 1)]
        ]), 1, 1), new TwingNode(), 1, 1);

        test.same(await visit(node), [
            resolvePath('test/unit/fixtures/bar.twig'),
            resolvePath('test/unit/fixtures/lorem.twig')
        ], 'template names are valid');

        node = new TwingNodeImport(new TwingNodeExpressionConditional(
            new TwingNode(),
            new TwingNodeExpressionConstant('./bar.twig', 1, 1),
            new TwingNodeExpressionConstant('./lorem.twig', 1, 1),
            1, 1
        ), new TwingNode(), 1, 1);

        test.same(await visit(node), [
            resolvePath('test/unit/fixtures/bar.twig'),
            resolvePath('test/unit/fixtures/lorem.twig')
        ], 'template names are valid');
        test.same(node.getNode('expr').getNode('expr2').getAttribute('value'), 'HASHED::' + resolvePath('test/unit/fixtures/bar.twig'), 'expression 2 path is resolved');
        test.same(node.getNode('expr').getNode('expr3').getAttribute('value'), 'HASHED::' + resolvePath('test/unit/fixtures/lorem.twig'), 'expression 3 path is resolved');

        test.end();
    });

    test.test('handles include tag', async (test: Test) => {
        let node = new TwingNodeInclude(new TwingNodeExpressionConstant('./bar.twig', 1, 1), new TwingNode(), false, false, 1, 1);

        test.same(await visit(node), [
            resolvePath('test/unit/fixtures/bar.twig')
        ], 'template names are valid');
        test.same(node.getNode('expr').getAttribute('value'), 'HASHED::' + resolvePath('test/unit/fixtures/bar.twig'), 'expression path is resolved');

        node = new TwingNodeInclude(new TwingNodeExpressionArray(new Map([
            ['0', new TwingNode()],
            ['1', new TwingNodeExpressionConstant('./bar.twig', 1, 1)],
            ['2', new TwingNode()],
            ['3', new TwingNodeExpressionConstant('./lorem.twig', 1, 1)]
        ]), 1, 1), new TwingNode(), false, false, 1, 1);

        test.same(await visit(node), [
            resolvePath('test/unit/fixtures/bar.twig'),
            resolvePath('test/unit/fixtures/lorem.twig')
        ], 'template names are valid');

        node = new TwingNodeInclude(new TwingNodeExpressionConditional(
            new TwingNode(),
            new TwingNodeExpressionConstant('./bar.twig', 1, 1),
            new TwingNodeExpressionConstant('./lorem.twig', 1, 1),
            1, 1), new TwingNode(), false, false, 1, 1);

        test.same(await visit(node), [
            resolvePath('test/unit/fixtures/bar.twig'),
            resolvePath('test/unit/fixtures/lorem.twig')
        ], 'template names are valid');
        test.same(node.getNode('expr').getNode('expr2').getAttribute('value'), 'HASHED::' + resolvePath('test/unit/fixtures/bar.twig'), 'expression 2 path is resolved');
        test.same(node.getNode('expr').getNode('expr3').getAttribute('value'), 'HASHED::' + resolvePath('test/unit/fixtures/lorem.twig'), 'expression 3 path is resolved');

        test.end();
    });

    test.test('handles module with parent', async (test: Test) => {
        let node = new TwingNodeModule(new TwingNode(), new TwingNodeExpressionConstant('./bar.twig', 1, 1), new TwingNode(), new TwingNode(), new TwingNode(), [], new TwingSource('', 'foo', getEntryPath()));

        test.same(await visit(node), [resolvePath('test/unit/fixtures/bar.twig')], 'template names are valid');
        test.same(node.getNode('parent').getAttribute('value'), 'HASHED::' + resolvePath('test/unit/fixtures/bar.twig'), 'expression path is resolved');

        test.end();
    });

    test.test('ignore missing templates', async (test: Test) => {
        let node = new TwingNodeExpressionFunction('include', new TwingNode(new Map([
            [0, new TwingNodeExpressionConstant('./bare.twig', 1, 1)]
        ])), 1, 1);

        test.same(await visit(node), []);

        let environment = new TwingEnvironment(new TwingLoaderArray({
            bar: 'BAR'
        }));

        node = new TwingNodeExpressionFunction('include', new TwingNode(new Map([
            [0, new TwingNodeExpressionConstant('bar', 1, 1)]
        ])), 1, 1);

        test.same(await visit(node, environment), []);

        test.end();
    });

    test.test('deduplicates templates', async (test: Test) => {
        let node = new TwingNodeBody(new Map([
            [0, new TwingNodeExpressionFunction('include', new TwingNode(new Map([
                [0, new TwingNodeExpressionConstant('./bar.twig', 1, 1)]
            ])), 1, 1)],
            [1, new TwingNodeExpressionFunction('include', new TwingNode(new Map([
                [0, new TwingNodeExpressionConstant('./bar.twig', 1, 1)]
            ])), 1, 1)]
        ]));

        test.same(await visit(node), [
            resolvePath('test/unit/fixtures/bar.twig')
        ]);

        test.end();
    });

    test.end();
});
