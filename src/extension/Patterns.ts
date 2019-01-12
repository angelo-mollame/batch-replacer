export class Patterns {
    public static filter: string = "^filter\\s+(.*)$";
    public static in: string = "^in\\s+(.*)$";
    public static replace: string = "^replace\\s+\\{(.*)\\}$";
    public static replaceRegex: string = "^replace-regex\\s+\\{(.*)\\}$";
    public static variable: string = "^(\\w+)\\s*=\\s*\\{(.*)\\}$";
    public static with: string = "^with\\s+\\{(.*)\\}$";
}