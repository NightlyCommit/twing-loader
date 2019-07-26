import {TestCase} from "../test-case";

new (class extends TestCase {
    get expectedTemplateNames() {
        return [
            'parent.twig'
        ];
    }
})(__dirname).run();
