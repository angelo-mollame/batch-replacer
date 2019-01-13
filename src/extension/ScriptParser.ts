import { Patterns } from "./Patterns";
import { RegexUtils } from "./RegexUtils";
import { ReplaceCommand } from "./ReplaceCommand";
import { Result } from "./Result";
import { ResultUtils } from "./ResultUtils";
import { Script } from "./Script";
import { StringUtils } from "./StringUtils";
import { Tokens } from "./Tokens";
import { Variable } from "./Variable";
import { Verify } from "./Verify";

export class ScriptParser {
    private static defaultFilePattern: string = "**/*";

    public static tryParseScript(text: string): Result<Script> {
        const variablesByName: Map<string, Variable> = new Map();
        const replaceCommands: ReplaceCommand[] = [];
        const lines = text.split(/\r?\n/);

        let asRegex: boolean = false;

        let filter: string | undefined = undefined;
        let _in: string | undefined = undefined;
        let replace: string | undefined = undefined;
        let _with: string | undefined = undefined;

        let lineNumber: number = 0;

        for (let line of lines) {
            lineNumber++;
            line = line.trim();

            if (line === "") {
                continue;
            }

            if (line.startsWith(Tokens.comment)) {
                continue;
            }

            const parseResult: LineParseResult = this.parseLine(line);

            switch(parseResult.kind) {
                case LineParserResultKind.Filter:
                    if (filter !== undefined) {
                        return ResultUtils.failure(`Unexpected 'filter' instruction at line ${lineNumber}: ${line}`);
                    }

                    if (!parseResult.filter) {
                        return ResultUtils.failure(`Invalid 'filter' instruction at line ${lineNumber}: ${line}`);
                    }

                    filter = parseResult.filter;
                    break;

                case LineParserResultKind.In:
                    if (_in !== undefined || replace !== undefined || _with !== undefined) {
                        return ResultUtils.failure(`Unexpected 'in' instruction at line ${lineNumber}: ${line}`);
                    }

                    if (!parseResult.in) {
                        return ResultUtils.failure(`Invalid 'in' instruction at line ${lineNumber}: ${line}`);
                    }

                    _in = parseResult.in;
                    break;

                case LineParserResultKind.Replace:
                    if (replace !== undefined || _with !== undefined) {
                        return ResultUtils.failure(`Unexpected 'replace' instruction at line ${lineNumber}: ${line}`);
                    }

                    replace = parseResult.replace;
                    break;

                case LineParserResultKind.ReplaceRegex:
                    if (replace !== undefined || _with !== undefined) {
                        return ResultUtils.failure(
                            `Unexpected 'replace-regex' instruction at line ${lineNumber}: ${line}`);
                    }

                    replace = parseResult.replaceRegex;
                    asRegex = true;
                    break;

                case LineParserResultKind.With:
                    if (replace === undefined || _with !== undefined) {
                        return ResultUtils.failure(`Unexpected 'with' instruction at line ${lineNumber}: ${line}`);
                    }

                    _with = parseResult.with;
                    break;

                case LineParserResultKind.Variable:
                    if (_in !== undefined ||
                        replace !== undefined ||
                        _with !== undefined ||
                        replaceCommands.length > 0
                    ) {
                        return ResultUtils.failure(`Unexpected variable at line ${lineNumber}: ${line}`);
                    }

                    const variable: Variable = parseResult.variable;
                    variable.value = this.resolveVariables(variable.value, variablesByName.values());
                    variablesByName.set(variable.name, variable);
                    break;

                case LineParserResultKind.Unrecognized:
                    return ResultUtils.failure(`Unrecognized instruction at line ${lineNumber}: ${line}`);

                default:
                    Verify.isNever(parseResult);
            }

            if (replace !== undefined && _with !== undefined) {
                replaceCommands.push({
                    in: _in || this.defaultFilePattern,
                    asRegex,
                    replace,
                    with: _with
                });

                _in = undefined;
                asRegex = false;
                replace = undefined;
                _with = undefined;
            }
        }

        for (const replaceCommand of replaceCommands) {
            replaceCommand.replace = this.resolveVariables(replaceCommand.replace, variablesByName.values());
        }

        return ResultUtils.success({
            filter: filter || this.defaultFilePattern,
            replaceCommands
        });
    }

    private static parseLine(line: string): LineParseResult {
        {
            const filterMatchGroups: string[] | undefined = RegexUtils.extractWithRegex(line, Patterns.filter);

            if (filterMatchGroups) {
                return {
                    kind: LineParserResultKind.Filter,
                    filter: filterMatchGroups[0].trim()
                };
            }
        }

        {
            const inMatchGroups: string[] | undefined = RegexUtils.extractWithRegex(line, Patterns.in);

            if (inMatchGroups) {
                return {
                    kind: LineParserResultKind.In,
                    in: inMatchGroups[0].trim()
                };
            }
        }

        {
            const replaceMatchGroups: string[] | undefined = RegexUtils.extractWithRegex(line, Patterns.replace);

            if (replaceMatchGroups) {
                return {
                    kind: LineParserResultKind.Replace,
                    replace: replaceMatchGroups[0]
                };
            }
        }

        {
            const replaceRegexMatchGroups: string[] | undefined =
                RegexUtils.extractWithRegex(line, Patterns.replaceRegex);

            if (replaceRegexMatchGroups) {
                return {
                    kind: LineParserResultKind.ReplaceRegex,
                    replaceRegex: replaceRegexMatchGroups[0]
                };
            }
        }

        {
            const withMatchGroups: string[] | undefined = RegexUtils.extractWithRegex(line, Patterns.with);

            if (withMatchGroups) {
                return {
                    kind: LineParserResultKind.With,
                    with: withMatchGroups[0]
                };
            }
        }

        {
            const variableMatchGroups: string[] | undefined = RegexUtils.extractWithRegex(line, Patterns.variable);

            if (variableMatchGroups) {
                return {
                    kind: LineParserResultKind.Variable,
                    variable: {
                        name: variableMatchGroups[0],
                        value: variableMatchGroups[1]
                    }
                };
            }
        }

        return {
            kind: LineParserResultKind.Unrecognized
        };
    }

    private static resolveVariables(value: string, variables: Iterable<Variable>): string {
        for (const variable of variables) {
            value = StringUtils.replaceAll(value, `%{${variable.name}}`, variable.value);
        }

        return value;
    }
}

const enum LineParserResultKind {
    Filter,
    In,
    Replace,
    ReplaceRegex,
    Variable,
    With,
    Unrecognized
}

type LineParseResult = {
    kind: LineParserResultKind.Filter;
    filter: string;
} | {
    kind: LineParserResultKind.In;
    in: string;
} | {
    kind: LineParserResultKind.Replace;
    replace: string;
} | {
    kind: LineParserResultKind.ReplaceRegex;
    replaceRegex: string;
} | {
    kind: LineParserResultKind.Variable;
    variable: Variable;
} | {
    kind: LineParserResultKind.With;
    with: string;
} | {
    kind: LineParserResultKind.Unrecognized;
}