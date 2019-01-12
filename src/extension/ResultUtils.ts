import { Result } from "./Result";

export class ResultUtils {
    public static failure<T>(errorMessage: string): Result<T> {
        return {
            success: false,
            errorMessage
        };
    }

    public static success<T>(value: T): Result<T> {
        return {
            success: true,
            value
        }
    }
}