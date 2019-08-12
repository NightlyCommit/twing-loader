import {TestCase} from "../test-case";
import {TestSuite} from "../test-suite";

class FromTestCase extends TestCase {
    get entry() {
        return __dirname + '/entry.js';
    }

    get expected() {
        return `BAR
`;
    }
}

(new TestSuite('from tag', [
    new FromTestCase(),
    new FromTestCase({
        foo: 'BAR'
    })
])).run();
