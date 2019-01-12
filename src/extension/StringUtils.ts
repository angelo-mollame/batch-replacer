import { RegexUtils } from "./RegexUtils";

export class StringUtils {
    public static replaceAll(value: string, oldValue: string, newValue: string, asRegex?: boolean): string {
        if (!asRegex) {
            oldValue = RegexUtils.escapeRegex(oldValue);
        }

        if (asRegex) {
            newValue = StringUtils.replaceAll(newValue, "\\r", "\r");
            newValue = StringUtils.replaceAll(newValue, "\\n", "\n");
            newValue = StringUtils.replaceAll(newValue, "\\t", "\t");
        }

        return value.replace(new RegExp(oldValue, "g"), newValue);
    }
}