import * as vscode from "vscode";

import { BatchReplacer } from "./BatchReplacer";
import { VsCodeHost } from "./VsCodeHost";

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "batchReplacer.batchReplace",
            () => BatchReplacer.batchReplace(new VsCodeHost())));
}