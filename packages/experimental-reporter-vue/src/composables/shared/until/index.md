---
category: Watch
---

# until

Promised one-time watch for changes

## Usage

#### Wait for some async data to be ready

```js
import { until, useAsyncState } from '@vueuse/core'

const { state, ready } = useAsyncState(
  fetch('https://jsonplaceholder.typicode.com/todos/1').then(t => t.json()),
  {},
)

;(async() => {
  await until(ready).toBe(true)

  console.log(state) // state is now ready!
})()
```

#### Wait for custom conditions

> You can use `invoke` to call the async function.

```js
import { until, useCounter, invoke } from '@vueuse/core'

const { count } = useCounter()

invoke(async() => {
  await until(count).toMatch(v => v > 7)

  alert('Counter is now larger than 7!')
})
```

#### Timeout

```ts
// will be resolve until ref.value === true or 1000ms passed
await until(ref).toBe(true, { timeout: 1000 })

// will throw if timeout
try {
  await until(ref).toBe(true, { timeout: 1000, throwOnTimeout: true })
  // ref.value === true
} catch(e) {
  // timeout
}
```

#### More Examples

```ts
await until(ref).toBe(true)
await until(ref).toMatch(v => v > 10 && v < 100)
await until(ref).changed()
await until(ref).changedTimes(10)
await until(ref).toBeTruthy()
await until(ref).toBeNull()

await until(ref).not.toBeNull()
await until(ref).not.toBeTruthy()
```


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface UntilToMatchOptions {
  /**
   * Milliseconds timeout for promise to resolve/reject if the when condition does not meet.
   * 0 for never timed out
   *
   * @default 0
   */
  timeout?: number
  /**
   * Reject the promise when timeout
   *
   * @default false
   */
  throwOnTimeout?: boolean
  /**
   * `flush` option for internal watch
   *
   * @default 'sync'
   */
  flush?: WatchOptions["flush"]
  /**
   * `deep` option for internal watch
   *
   * @default 'false'
   */
  deep?: WatchOptions["deep"]
}
export interface UntilBaseInstance<T> {
  toMatch(
    condition: (v: T) => boolean,
    options?: UntilToMatchOptions
  ): Promise<void>
  changed(options?: UntilToMatchOptions): Promise<void>
  changedTimes(n?: number, options?: UntilToMatchOptions): Promise<void>
}
export interface UntilValueInstance<T> extends UntilBaseInstance<T> {
  readonly not: UntilValueInstance<T>
  toBe<P = T>(
    value: MaybeRef<T | P>,
    options?: UntilToMatchOptions
  ): Promise<void>
  toBeTruthy(options?: UntilToMatchOptions): Promise<void>
  toBeNull(options?: UntilToMatchOptions): Promise<void>
  toBeUndefined(options?: UntilToMatchOptions): Promise<void>
  toBeNaN(options?: UntilToMatchOptions): Promise<void>
}
export interface UntilArrayInstance<T> extends UntilBaseInstance<T> {
  readonly not: UntilArrayInstance<T>
  toContains(
    value: MaybeRef<ElementOf<ShallowUnwrapRef<T>>>,
    options?: UntilToMatchOptions
  ): Promise<void>
}
/**
 * Promised one-time watch for changes
 *
 * @see https://vueuse.org/until
 * @example
 * ```
 * const { count } = useCounter()
 *
 * await until(count).toMatch(v => v > 7)
 *
 * alert('Counter is now larger than 7!')
 * ```
 */
export declare function until<T extends unknown[]>(
  r: WatchSource<T> | MaybeRef<T>
): UntilArrayInstance<T>
export declare function until<T>(
  r: WatchSource<T> | MaybeRef<T>
): UntilValueInstance<T>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/shared/until/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/shared/until/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/shared/until/index.md)


<!--FOOTER_ENDS-->
