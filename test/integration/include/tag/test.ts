import {TestCase} from "../../test-case";
import {TestSuite} from "../../test-suite";

class IncludeTagTestCase extends TestCase {
    get entry() {
        return __dirname + '/entry.js';
    }

    get expected() {
        return `FOOFOOFOO===
BARFOO 2FOO`;
    }
}

(new TestSuite('include tag', [
    new IncludeTagTestCase(),
    new IncludeTagTestCase({
        foo: true,
        bar: false
    })
])).run();
