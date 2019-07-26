import {TestCase} from "../test-case";
import {TestSuite} from "../test-suite";

class ImportTestCase extends TestCase {
    get entry() {
        return __dirname + '/entry.js';
    }

    get expected() {
        return `BAR
`;
    }
}

(new TestSuite('import tag', [
    new ImportTestCase(),
    new ImportTestCase({
        foo: 'BAR'
    })
])).run();
