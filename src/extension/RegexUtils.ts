export class RegexUtils {
    public static escapeRegex(value: string): string {
        return value.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    }

    // The pattern should contain groups.
    // If the pattern matches, this method will return the content of each group.
    //
    // Example: extractWithRegex("abc 123 def", "(\\d+)") === ["123"]
    // Example: extractWithRegex("abc = 123", "(.*) = (.*)") === ["abc", "123"]
    public static extractWithRegex(value: string, pattern: string): string[] | undefined {
        const regex: RegExp = RegExp(pattern, "g");
        const result: RegExpExecArray | null = regex.exec(value);

        if (result == null) {
            return undefined;
        }

        return result.splice(1);
    }
}