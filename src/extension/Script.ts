import { ReplaceCommand } from "./ReplaceCommand";

export interface Script {
    filter: string;
    replaceCommands: ReplaceCommand[];
}