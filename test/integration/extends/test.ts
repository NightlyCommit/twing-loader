import {TestCase} from "../test-case";
import {TestSuite} from "../test-suite";

class ExtendsTestCase extends TestCase {
    get entry() {
        return __dirname + '/entry.js';
    }

    get expected() {
        return `BAR
`;
    }
}

(new TestSuite('extends tag', [
    new ExtendsTestCase(),
    new ExtendsTestCase({
        foo: 'BAR'
    })
])).run();
