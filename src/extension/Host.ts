export interface Host {
    findFilePaths(filePattern: string): Promise<Set<string>>;
    getScriptText(): string | undefined;
    readFile(filePath: string): string;
    showErrorMessage(errorMessage: string): void;
    showInformationMessage(informationMessage: string): void;
    writeFile(filePath: string, content: string): void;
}