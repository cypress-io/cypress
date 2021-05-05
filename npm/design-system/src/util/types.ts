export type ExtractFirstArg<T extends (...args: any[]) => unknown> = Parameters<T>[0]
