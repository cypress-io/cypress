---
category: Utilities
---

# syncRef

Keep target refs in sync with a source ref

## Usage

```ts
import { syncRef } from '@vueuse/core'

const source = ref('hello')
const target = ref('target')

const stop = syncRef(source, target)

console.log(target.value) // hello

source.value = 'foo'

console.log(target.value) // foo
```

## Watch options

The options for `syncRef` are similar to `watch`'s `WatchOptions` but with different default values.

```ts
export interface SyncRefOptions {
  /**
   * Timing for syncing, same as watch's flush option
   *
   * @default 'sync'
   */
  flush?: WatchOptions['flush']
  /**
   * Watch deeply
   *
   * @default false
   */
  deep?: boolean
  /**
   * Sync values immediately
   *
   * @default true
   */
  immediate?: boolean
}
```

When setting `{ flush: 'pre' }`, the target reference will be updated at [the end of the current "tick"](https://v3.vuejs.org/guide/reactivity-computed-watchers.html#effect-flush-timing) before rendering starts.

```ts
import { syncRef } from '@vueuse/core'

const source = ref('hello')
const target = ref('target')

syncRef(source, target, { flush: 'pre' })

console.log(target.value) // hello

source.value = 'foo'

console.log(target.value) // hello <- still unchanged, because of flush 'pre'

await nextTick()

console.log(target.value) // foo <- changed!
```

## Related Functions

- `biSyncRef`


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface SyncRefOptions extends ConfigurableFlushSync {
  /**
   * Watch deeply
   *
   * @default false
   */
  deep?: boolean
  /**
   * Sync values immediately
   *
   * @default true
   */
  immediate?: boolean
}
/**
 * Keep target ref(s) in sync with the source ref
 *
 * @param source source ref
 * @param targets
 */
export declare function syncRef<R extends Ref<any>>(
  source: R,
  targets: R | R[],
  { flush, deep, immediate }?: SyncRefOptions
): WatchStopHandle
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/shared/syncRef/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/shared/syncRef/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/shared/syncRef/index.md)


<!--FOOTER_ENDS-->
