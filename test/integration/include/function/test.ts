import {TestCase} from "../../test-case";
import {TestSuite} from "../../test-suite";

class IncludeFunctionTestCase extends TestCase {
    get entry() {
        return __dirname + '/entry.js';
    }

    get expected() {
        return `FOO
FOO
FOO
===
BAR
FOO 2
FOO`;
    }
}

(new TestSuite('include function', [
    new IncludeFunctionTestCase(),
    new IncludeFunctionTestCase({
        foo: true,
        bar: false
    })
])).run();
