---
category: Watch
---

# throttledWatch

Throttled watch.

## Usage

Similar to `watch`, but offering an extra option `throttle` which will be applied to the callback function.

```ts
import { throttledWatch } from '@vueuse/core'

throttledWatch(
  source,
  () => { console.log('changed!') },
  { throttle: 500 }
)
```

It's essentially a shorthand for the following code:

```ts
import { watchWithFilter, throttleFilter } from '@vueuse/core'

watchWithFilter(
  source,
  () => { console.log('changed!') },
  {
    eventFilter: throttleFilter(500),
  }
)
```


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface ThrottledWatchOptions<Immediate>
  extends WatchOptions<Immediate> {
  throttle?: MaybeRef<number>
}
export declare function throttledWatch<
  T extends Readonly<WatchSource<unknown>[]>,
  Immediate extends Readonly<boolean> = false
>(
  sources: T,
  cb: WatchCallback<MapSources<T>, MapOldSources<T, Immediate>>,
  options?: ThrottledWatchOptions<Immediate>
): WatchStopHandle
export declare function throttledWatch<
  T,
  Immediate extends Readonly<boolean> = false
>(
  source: WatchSource<T>,
  cb: WatchCallback<T, Immediate extends true ? T | undefined : T>,
  options?: ThrottledWatchOptions<Immediate>
): WatchStopHandle
export declare function throttledWatch<
  T extends object,
  Immediate extends Readonly<boolean> = false
>(
  source: T,
  cb: WatchCallback<T, Immediate extends true ? T | undefined : T>,
  options?: ThrottledWatchOptions<Immediate>
): WatchStopHandle
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/shared/throttledWatch/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/shared/throttledWatch/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/shared/throttledWatch/index.md)


<!--FOOTER_ENDS-->
