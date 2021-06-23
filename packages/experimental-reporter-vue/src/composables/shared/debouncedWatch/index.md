---
category: Watch
---

# debouncedWatch

Debounced watch

## Usage

Similar to `watch`, but offering an extra option `debounce` which will be applied to the callback function.

```ts
import { debouncedWatch } from '@vueuse/core'

debouncedWatch(
  source,
  () => { console.log('changed!') },
  { debounce: 500 }
)
```

It's essentially a shorthand for the following code:

```ts
import { watchWithFilter, debounceFilter } from '@vueuse/core'

watchWithFilter(
  source,
  () => { console.log('changed!') },
  {
    eventFilter: debounceFilter(500),
  }
)
```


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface DebouncedWatchOptions<Immediate>
  extends WatchOptions<Immediate> {
  debounce?: MaybeRef<number>
}
export declare function debouncedWatch<
  T extends Readonly<WatchSource<unknown>[]>,
  Immediate extends Readonly<boolean> = false
>(
  sources: T,
  cb: WatchCallback<MapSources<T>, MapOldSources<T, Immediate>>,
  options?: DebouncedWatchOptions<Immediate>
): WatchStopHandle
export declare function debouncedWatch<
  T,
  Immediate extends Readonly<boolean> = false
>(
  source: WatchSource<T>,
  cb: WatchCallback<T, Immediate extends true ? T | undefined : T>,
  options?: DebouncedWatchOptions<Immediate>
): WatchStopHandle
export declare function debouncedWatch<
  T extends object,
  Immediate extends Readonly<boolean> = false
>(
  source: T,
  cb: WatchCallback<T, Immediate extends true ? T | undefined : T>,
  options?: DebouncedWatchOptions<Immediate>
): WatchStopHandle
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/shared/debouncedWatch/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/shared/debouncedWatch/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/shared/debouncedWatch/index.md)


<!--FOOTER_ENDS-->
