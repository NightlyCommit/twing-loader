import {TestCase} from "../test-case";
import {TestSuite} from "../test-suite";

class SourceFunctionTestCase extends TestCase {
    get entry() {
        return __dirname + '/entry.js';
    }

    get expected() {
        return `FOO
FOO
===
BAR
FOO 2`;
    }
}

(new TestSuite('source function', [
    new SourceFunctionTestCase(),
    new SourceFunctionTestCase({
        foo: true,
        bar: false
    })
])).run();
