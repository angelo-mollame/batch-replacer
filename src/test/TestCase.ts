export type TestCase = {
    name: string;
    files: Map<string, string>;
    scriptText: string;
} & ({
    expectedSuccess: true;
    expectedModifiedFiles: Map<string, string>;
} | {
    expectedSuccess: false;
    expectedErrorMessage: string;
});