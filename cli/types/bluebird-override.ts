type PromisifyAllKeys<T> = T extends string ? T | `${T}Async` : T
type GetValueForKey<T, K> = K extends keyof T ? T[K] : never
type WithoutLast<T extends any[]> = T extends [...infer A, any] ? A : []
type Last<T extends any[]> = T extends [...any[], infer L] ? L : never
type ExtractCallbackValueType<T> = T extends (error: any, ...data: infer D) => any ? D : never
type ExtractAsyncMethod<T> = T extends (...args: infer A) => any ? (...arg: WithoutLast<A>) => Promise<ExtractCallbackValueType<Last<Required<A>>>[0]> : never
type ValidPromiseOrNever<T> = ExtractAsyncMethod<T> extends (...args: any[]) => Promise<never> ? never : ExtractAsyncMethod<T>

type PromisifyAllItems<T> = {
  [Key in PromisifyAllKeys<keyof T>]: Key extends `${infer S}Async` ?
    S extends keyof T ?
      ValidPromiseOrNever<T[S]> :
      GetValueForKey<T, Key> :
    GetValueForKey<T, Key>
}

type NonNeverKeys<T> = ({
  [Key in keyof T]: T[Key] extends never ? never : Key
})[keyof T]

// Drop `never` values
// TODO: Remove once https://github.com/DefinitelyTyped/DefinitelyTyped/pull/52907 is merged
export type PromisifyAll<T> = Pick<PromisifyAllItems<T>, NonNeverKeys<PromisifyAllItems<T>>>
