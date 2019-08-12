import {TestCase} from "../test-case";
import {TestSuite} from "../test-suite";

class EmbedTestCase extends TestCase {
    get entry() {
        return __dirname + '/entry.js';
    }

    get expected() {
        return `FOO
BAR`;
    }
}

(new TestSuite('embed tag', [
    new EmbedTestCase(),
    new EmbedTestCase({
        foo: 'BAR'
    })
])).run();
