export type ExtractFirstArg<T extends (...args: any[]) => unknown> = T extends (arg0: infer S, ...otherArgs: any[]) => unknown ? S : never
