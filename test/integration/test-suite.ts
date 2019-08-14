import {TestCase} from "./test-case";
import {Test} from "tape";
import tape = require("tape");

export class TestSuite {
    private readonly _name: string;
    private readonly _testCases: TestCase[];

    constructor(name: string, testCases: TestCase[]) {
        this._name = name;
        this._testCases = testCases;
    }

    run() {
        tape(this._name, (test: Test) => {
            let promises: Promise<void>[] = [];

            for (let testCase of this._testCases) {
                promises.push(testCase.run(test));
            }

            return Promise.all(promises)
                .then(() => {
                    test.end();
                })
                .catch(() => {
                    test.end();
                })
        });
    }
}
