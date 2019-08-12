import {TestCase} from "../test-case";
import {TestSuite} from "../test-suite";

class ArrayLoaderTestCase extends TestCase {
    get entry() {
        return __dirname + '/entry.js';
    }

    get environmentModulePath(): string {
        return __dirname + '/environment.js';
    }

    get expected() {
        return `BAR FROM THE FS LOADER
BAR FROM THE ARRAY LOADER
`;
    }
}

(new TestSuite('with an array loader', [
    new ArrayLoaderTestCase(),
    new ArrayLoaderTestCase({
        foo: 'BAR'
    })
])).run();
