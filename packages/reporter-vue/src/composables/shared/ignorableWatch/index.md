---
category: Watch
---

# ignorableWatch

Ignorable watch

## Usage

Extended `watch` that returns extra `ignoreUpdates(updater)` and `ignorePrevAsyncUpdates()` to ignore particular updates to the source.

```ts
import { ignorableWatch } from '@vueuse/core'
import { ref, nextTick } from 'vue'

const source = ref('foo')

const { stop, ignoreUpdates } = ignorableWatch(
  source,
  (v) => console.log(`Changed to ${v}!`),
)

source.value = 'bar'
await nextTick() // logs: Changed to bar!

ignoreUpdates(() => {
  source.value = 'foobar'
})
await nextTick() // (nothing happened)

source.value = 'hello'
await nextTick() // logs: Changed to hello!

ignoreUpdates(() => {
  source.value = 'ignored'
})
source.value = 'logged'

await nextTick() // logs: Changed to logged!
```

## Flush timing

`ignorableWatch` accepts the same options as `watch` and uses the same defaults.
So, by default the composable works using `flush: 'pre'`.

## `ignorePrevAsyncUpdates`

This feature is only for async flush `'pre'` and `'post'`. If `flush: 'sync'` is used, `ignorePrevAsyncUpdates()` is a no-op as the watch will trigger immediately after each update to the source. It is still provided for sync flush so the code can be more generic.

```ts
import { ignorableWatch } from '@vueuse/core'
import { ref, nextTick } from 'vue'

const source = ref('foo')

const { ignorePrevAsyncUpdates } = ignorableWatch(
  source,
  (v) => console.log(`Changed to ${v}!`),
)

source.value = 'bar'
await nextTick() // logs: Changed to bar!

source.value = 'good'
source.value = 'by'
ignorePrevAsyncUpdates()

await nextTick() // (nothing happened)

source.value = 'prev'
ignorePrevAsyncUpdates()
source.value = 'after'

await nextTick() // logs: Changed to after!
```

## Recommended Readings

- [Ignorable Watch](https://patak.dev/vue/ignorable-watch.html) - by [@matias-capeletto](https://github.com/matias-capeletto)

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export declare type IgnoredUpdater = (updater: () => void) => void
export interface IgnorableWatchReturn {
  ignoreUpdates: IgnoredUpdater
  ignorePrevAsyncUpdates: () => void
  stop: WatchStopHandle
}
export declare function ignorableWatch<
  T extends Readonly<WatchSource<unknown>[]>,
  Immediate extends Readonly<boolean> = false
>(
  sources: T,
  cb: WatchCallback<MapSources<T>, MapOldSources<T, Immediate>>,
  options?: WatchWithFilterOptions<Immediate>
): IgnorableWatchReturn
export declare function ignorableWatch<
  T,
  Immediate extends Readonly<boolean> = false
>(
  source: WatchSource<T>,
  cb: WatchCallback<T, Immediate extends true ? T | undefined : T>,
  options?: WatchWithFilterOptions<Immediate>
): IgnorableWatchReturn
export declare function ignorableWatch<
  T extends object,
  Immediate extends Readonly<boolean> = false
>(
  source: T,
  cb: WatchCallback<T, Immediate extends true ? T | undefined : T>,
  options?: WatchWithFilterOptions<Immediate>
): IgnorableWatchReturn
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/shared/ignorableWatch/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/shared/ignorableWatch/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/shared/ignorableWatch/index.md)


<!--FOOTER_ENDS-->
