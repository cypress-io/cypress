/**
 * Extracts the first argument of a function
 */
export type ExtractFirstArg<T extends (...args: any[]) => unknown> = Parameters<T>[0]
