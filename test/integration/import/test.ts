import {TestCase} from "../test-case";

new (class extends TestCase {
    get expectedTemplateNames() {
        return [
            'macros.twig'
        ];
    }
})(__dirname).run();
