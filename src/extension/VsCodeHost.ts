import * as FS from "fs";
import * as vscode from "vscode";

import { Host } from "./Host";

export class VsCodeHost implements Host {
    public async findFilePaths(filePattern: string): Promise<Set<string>> {
        const files: vscode.Uri[] = await vscode.workspace.findFiles(filePattern);
        return new Set<string>(files.map(file => file.fsPath));
    }

    public getScriptText(): string | undefined {
        const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;

        if (!editor) {
            return;
        }

        const document: vscode.TextDocument = editor.document;
        return document.getText();
    }

    public readFile(filePath: string): string {
        return FS.readFileSync(filePath, "utf8");
    }

    public showErrorMessage(errorMessage: string): void {
        vscode.window.showErrorMessage(errorMessage);
    }

    public showInformationMessage(informationMessage: string): void {
        vscode.window.showInformationMessage(informationMessage);
    }

    public writeFile(filePath: string, content: string): void {
        FS.writeFileSync(filePath, content, "utf8");
    }
}