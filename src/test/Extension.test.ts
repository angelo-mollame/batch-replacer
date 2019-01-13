import * as assert from 'assert';

import { BatchReplacer } from '../extension/BatchReplacer';
import { TestCase } from './TestCase';
import { TestHost } from './TestHost';

function runTestCase(testCase: TestCase) {
    test(
        testCase.name,
        async () => {
            const host: TestHost = new TestHost(testCase.scriptText, testCase.files);
            await BatchReplacer.batchReplace(host);

            if (testCase.expectedSuccess) {
                assert.equal(host.getErrorMessages().length, 0, "No error messages expected");
                assertMapsEqual(host.getModifiedFiles(), testCase.expectedModifiedFiles);
            } else {
                assertArraysEqual(host.getErrorMessages(), [testCase.expectedErrorMessage]);
            }
        }
    )
}

function assertArraysEqual<T>(left: T[], right: T[]): void {
    assert.equal(left.length, right.length, "Arrays have different lengths");

    for (const index in left) {
        assert.equal(left[index], right[index], `Arrays have different values at index ${index}`);
    }
}

function assertMapsEqual<K, V>(left: Map<K, V>, right: Map<K, V>): void {
    for (const key of left.keys()) {
        if (!right.has(key)) {
            assert.fail(`Right map doesn't have ${key}`);
        }
    }

    for (const key of right.keys()) {
        if (!left.has(key)) {
            assert.fail(`Left map doesn't have ${key}`);
        }
    }

    for (const key of left.keys()) {
        assert.equal(left.get(key), right.get(key), `Maps have different values for ${key}`);
    }
}

suite("tests", () => {
    const testCases: TestCase[] = [
        {
            name: "simple script",
            files: new Map([[
                "file1.txt", "The quick brown fox jumps over the lazy dog"
            ]]),
            scriptText: `
                replace "brown"
                with "red"
                `,
            expectedSuccess: true,
            expectedModifiedFiles: new Map([[
                "file1.txt", "The quick red fox jumps over the lazy dog"
            ]])
        },

        {
            name: "comments are ignored",
            files: new Map([[
                "file1.txt", "The quick brown fox jumps over the lazy dog"
            ]]),
            scriptText: `
                // Replace "brown" with "red"
                replace "brown"
                with "red"
                `,
            expectedSuccess: true,
            expectedModifiedFiles: new Map([[
                "file1.txt", "The quick red fox jumps over the lazy dog"
            ]])
        },

        {
            name: "two replacements",
            files: new Map([[
                "file1.txt", "The quick brown fox jumps over the lazy dog"
            ]]),
            scriptText: `
                replace "brown"
                with "red"

                replace "lazy"
                with "stupid"
                `,
            expectedSuccess: true,
            expectedModifiedFiles: new Map([[
                "file1.txt", "The quick red fox jumps over the stupid dog"
            ]])
        },

        {
            name: "two files",
            files: new Map([
                [ "file1.txt", "The quick brown fox jumps over the lazy dog" ],
                [ "file2.txt", "The quick brown dog jumps over the lazy fox" ]
            ]),
            scriptText: `
                replace "over"
                with "way over"
                `,
            expectedSuccess: true,
            expectedModifiedFiles: new Map([
                [ "file1.txt", "The quick brown fox jumps way over the lazy dog" ],
                [ "file2.txt", "The quick brown dog jumps way over the lazy fox" ]
            ])
        },

        {
            name: "no matches",
            files: new Map([[
                "file1.txt", "The quick brown fox jumps over the lazy dog"
            ]]),
            scriptText: `
                replace "cat"
                with "cow"
                `,
            expectedSuccess: true,
            expectedModifiedFiles: new Map()
        },

        {
            name: "replace regex",
            files: new Map([[
                "file1.txt",
                "The quick brown fox jumps over the lazy dog"
            ]]),
            scriptText: `
                replace-regex "fox|dog"
                with "animal"
                `,
            expectedSuccess: true,
            expectedModifiedFiles: new Map([[
                "file1.txt",
                "The quick brown animal jumps over the lazy animal"
            ]])
        },

        {
            name: "replace regex with matches",
            files: new Map([[
                "file1.txt",
                "The quick brown fox jumps over the lazy dog"
            ]]),
            scriptText: `
                replace-regex "(quick|lazy)"
                with "very $1"
                `,
            expectedSuccess: true,
            expectedModifiedFiles: new Map([[
                "file1.txt",
                "The very quick brown fox jumps over the very lazy dog"
            ]])
        },

        {
            name: "replace with tab characters",
            files: new Map([[
                "file1.txt",
                "Label - Amount"
            ]]),
            scriptText: `
                replace-regex " - "
                with "\\t"
                `,
            expectedSuccess: true,
            expectedModifiedFiles: new Map([[
                "file1.txt",
                "Label\tAmount"
            ]])
        },

        {
            name: "whitespace ignored",
            files: new Map([[
                "file1.txt",
                `
                tax-return-2014
                tax-return-2015
                tax-return-2016
                `
            ]]),
            scriptText: `
                replace "tax-return-"
                with    "tax-return-documents-"
                `,
            expectedSuccess: true,
            expectedModifiedFiles: new Map([[
                "file1.txt",
                `
                tax-return-documents-2014
                tax-return-documents-2015
                tax-return-documents-2016
                `
            ]])
        },

        {
            name: "whitespace not ignored",
            files: new Map([[
                "file1.txt",
                `
                import AAA;
                import BBB;
                import CCC;
                `
            ]]),
            scriptText: `
                replace "import "
                with "export "
                `,
            expectedSuccess: true,
            expectedModifiedFiles: new Map([[
                "file1.txt",
                `
                export AAA;
                export BBB;
                export CCC;
                `
            ]])
        },

        {
            name: "variables",
            files: new Map([[
                "file1.txt",
                `
                C:\\Users\\johndoe\\Desktop\\My-Files\\new file.txt
                C:\\Users\\johndoe\\Desktop\\New Folder\\photo.jpg
                C:\\Users\\johndoe\\My.Documents\\doc.docx
                `
            ]]),
            scriptText: `
                extension = "\\.(txt|jpg|docx)"
                name = "[\\w\\. -]+"

                replace-regex "C:(\\\\%[name])*\\\\(%[name]%[extension])"
                with "$2"
                `,
            expectedSuccess: true,
            expectedModifiedFiles: new Map([[
                "file1.txt",
                `
                new file.txt
                photo.jpg
                doc.docx
                `
            ]])
        },

        {
            name: "self-referencing variables",
            files: new Map([[
                "file1.txt",
                `
                export interface {
                    function1(): void;
                    function2(a: string | undefined): string[];
                    function3(a: Map<string, number>, b: string[], c: string): Set<number> | undefined;
                    function4(a: Class1.Type2): void;
                }
                `
            ]]),
            scriptText: `
                name = "\\w+"
                type = "[\\w\\.]+"
                type = "%[type](?:<\\w+(?:, \\w+)*>)?"
                type = "%[type](?:\\[\\])?"
                type = "%[type](?: \\| %[type])?"
                parameter = "%[name]: %[type]"
                parameters = "(?:%[parameter](?:, %[parameter])*)?"

                replace-regex "(%[name])\\((%[parameters])\\): (%[type])"
                with "$1: ($2) => $3"
                `,
            expectedSuccess: true,
            expectedModifiedFiles: new Map([[
                "file1.txt",
                `
                export interface {
                    function1: () => void;
                    function2: (a: string | undefined) => string[];
                    function3: (a: Map<string, number>, b: string[], c: string) => Set<number> | undefined;
                    function4: (a: Class1.Type2) => void;
                }
                `
            ]])
        },

        {
            name: "invalid script - duplicate 'filter' instruction",
            files: new Map(),
            scriptText: `
                filter "*.txt"
                filter "**/*.txt"

                replace "brown"
                with "red"
                `,
            expectedSuccess: false,
            expectedErrorMessage: `Unexpected 'filter' instruction at line 3: filter "**/*.txt"`
        },

        {
            name: "invalid script - duplicate 'in' instruction",
            files: new Map(),
            scriptText: `
                in "*.txt"
                in "**/*.txt"
                replace "brown"
                with "red"
                `,
            expectedSuccess: false,
            expectedErrorMessage: `Unexpected 'in' instruction at line 3: in "**/*.txt"`
        },

        {
            name: "invalid script - duplicate 'replace' instruction",
            files: new Map(),
            scriptText: `
                replace "brown"
                replace "black"
                with "red"
                `,
            expectedSuccess: false,
            expectedErrorMessage: `Unexpected 'replace' instruction at line 3: replace "black"`
        },

        {
            name: "invalid script - duplicate 'replace-regex' instruction",
            files: new Map(),
            scriptText: `
                replace-regex "brown"
                replace-regex "black"
                with "red"
                `,
            expectedSuccess: false,
            expectedErrorMessage: `Unexpected 'replace-regex' instruction at line 3: replace-regex "black"`
        },

        {
            name: "invalid script - 'replace' and 'replace-regex' instruction",
            files: new Map(),
            scriptText: `
                replace "brown"
                replace-regex "black"
                with "red"
                `,
            expectedSuccess: false,
            expectedErrorMessage: `Unexpected 'replace-regex' instruction at line 3: replace-regex "black"`
        },

        {
            name: "invalid script - duplicate 'with' instruction",
            files: new Map(),
            scriptText: `
                replace "brown"
                with "red"
                with "black"
                `,
            expectedSuccess: false,
            expectedErrorMessage: `Unexpected 'with' instruction at line 4: with "black"`
        },

        {
            name: "invalid script - variable within script",
            files: new Map(),
            scriptText: `
                replace "brown"
                a = "b"
                with "red"
                `,
            expectedSuccess: false,
            expectedErrorMessage: `Unexpected variable at line 3: a = "b"`
        },

        {
            name: "invalid script - variable after script",
            files: new Map(),
            scriptText: `
                replace "brown"
                with "red"

                a = "b"
                `,
            expectedSuccess: false,
            expectedErrorMessage: `Unexpected variable at line 5: a = "b"`
        },

        {
            name: "invalid script - unrecognized instruction",
            files: new Map(),
            scriptText: `
                banana
                replace "brown"
                with "red"
                `,
            expectedSuccess: false,
            expectedErrorMessage: "Unrecognized instruction at line 2: banana"
        }
    ]

    for (const testCase of testCases) {
        runTestCase(testCase);
    }
});

