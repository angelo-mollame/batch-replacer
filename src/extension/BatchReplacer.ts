import { Host } from "./Host";
import { Result } from "./Result";
import { RewriteInstruction } from "./RewriteInstruction";
import { Script } from "./Script";
import { ScriptParser } from "./ScriptParser";
import { StringUtils } from "./StringUtils";

export class BatchReplacer {
    public static async batchReplace(host: Host): Promise<void> {
        if (!host.hasOpenFolders()) {
            host.showErrorMessage(
                "There are no open folders. " +
                "Make sure to open at least one folder in Visual Studio Code. " +
                "The script will perform the replacements in the files in the open folders.");

            return;
        }

        const scriptTextResult: Result<string> = host.tryGetScriptText();

        if (!scriptTextResult.success) {
            host.showErrorMessage(scriptTextResult.errorMessage);
            return;
        }

        const scriptText: string = scriptTextResult.value;
        const scriptResult: Result<Script> = ScriptParser.tryParseScript(scriptText);

        if (!scriptResult.success) {
            host.showErrorMessage("Failed to parse the script. " + scriptResult.errorMessage);
            return;
        }

        const script: Script = scriptResult.value;
        const filteredFilePaths: Set<string> = await host.findFilePaths(script.filter);
        const rewriteInstructionsByFilePath: Map<string, RewriteInstruction> = new Map();

        for (const command of script.replaceCommands) {
            const inFilePaths: Set<string> = await host.findFilePaths(command.in);

            for (const filePath of inFilePaths) {
                if (filteredFilePaths.has(filePath)) {
                    const currentRewriteInstruction: RewriteInstruction | undefined =
                        rewriteInstructionsByFilePath.get(filePath);

                    const currentText: string = currentRewriteInstruction ?
                        currentRewriteInstruction.newText :
                        host.readFile(filePath);

                    const newText: string = StringUtils.replaceAll(
                        currentText, command.replace, command.with, command.asRegex);

                    if (newText != currentText) {
                        rewriteInstructionsByFilePath.set(
                            filePath,
                            {
                                newText
                            });
                    }
                }
            }
        }

        for (const filePath of rewriteInstructionsByFilePath.keys()) {
            const rewriteInstruction: RewriteInstruction = rewriteInstructionsByFilePath.get(filePath)!;
            host.writeFile(filePath, rewriteInstruction.newText);
        }

        host.showInformationMessage(`Batch replace completed: ${rewriteInstructionsByFilePath.size} file(s) modified.`);
    }
}