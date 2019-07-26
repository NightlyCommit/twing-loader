import {TestCase} from "../../test-case";

new (class extends TestCase {
    get expectedTemplateNames() {
        return [
            'foo.twig',
            'bar.twig',
            'foo-2.twig'
        ];
    }

    get unexpectedTemplateNames() {
        return [
            'missing.twig'
        ];
    }
})(__dirname).run();
