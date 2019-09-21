import { Result } from "./Result";

export interface Host {
    findFilePaths(filePattern: string): Promise<Set<string>>;
    hasOpenFolders(): boolean;
    readFile(filePath: string): string;
    showErrorMessage(errorMessage: string): void;
    showInformationMessage(informationMessage: string): void;
    tryGetScriptText(): Result<string>;
    writeFile(filePath: string, content: string): void;
}