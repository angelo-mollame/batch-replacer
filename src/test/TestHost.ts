import { Host } from "../extension/Host";

export class TestHost implements Host {
    private readonly scriptText: string;
    private readonly files: Map<string, string>;
    private readonly modifiedFiles: Map<string, string>;
    private readonly errorMessages: string[];

    public constructor(scriptText: string, files: Map<string, string>) {
        this.scriptText = scriptText;
        this.files = files;
        this.modifiedFiles = new Map();
        this.errorMessages = [];
    }

    public findFilePaths(): Promise<Set<string>> {
        // TestHost ignores the file pattern for now
        return Promise.resolve(new Set<string>(this.files.keys()));
    }

    public getErrorMessages(): string[] {
        return this.errorMessages;
    }

    public getModifiedFiles(): Map<string, string> {
        return this.modifiedFiles;
    }

    public getScriptText(): string | undefined {
        return this.scriptText;
    }

    public hasOpenFolders(): boolean {
        return true;
    }

    public readFile(filePath: string): string {
        if (!this.files.has(filePath)) {
            throw new Error("File not found: " + filePath);
        }

        return this.files.get(filePath)!;
    }

    public showErrorMessage(errorMessage: string): void {
        this.errorMessages.push(errorMessage);
    }

    public showInformationMessage(): void {
    }

    public writeFile(filePath: string, content: string): void {
        this.files.set(filePath, content);
        this.modifiedFiles.set(filePath, content);
    }
}