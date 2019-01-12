export type Result<T> = {
    success: true;
    value: T;
} | {
    success: false;
    errorMessage: string;
}