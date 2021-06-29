---
category: Watch
---

# pausableWatch

Pausable watch

## Usage

Use as normal the `watch`, but return extra `pause()` and `resume()` functions to control.

```ts
import { pausableWatch } from '@vueuse/core'
import { ref, nextTick } from 'vue'

const source = ref('foo')

const { stop, pause, resume } = pausableWatch(
  source,
  (v) => console.log(`Changed to ${v}!`),
)

source.value = 'bar'
await nextTick() // Changed to bar!

pause()

source.value = 'foobar'
await nextTick() // (nothing happend)

resume()

source.value = 'hello'
await nextTick() // Changed to hello!
```


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface PausableWatchReturn extends Pausable {
  stop: WatchStopHandle
}
export declare function pausableWatch<
  T extends Readonly<WatchSource<unknown>[]>,
  Immediate extends Readonly<boolean> = false
>(
  sources: T,
  cb: WatchCallback<MapSources<T>, MapOldSources<T, Immediate>>,
  options?: WatchWithFilterOptions<Immediate>
): PausableWatchReturn
export declare function pausableWatch<
  T,
  Immediate extends Readonly<boolean> = false
>(
  source: WatchSource<T>,
  cb: WatchCallback<T, Immediate extends true ? T | undefined : T>,
  options?: WatchWithFilterOptions<Immediate>
): PausableWatchReturn
export declare function pausableWatch<
  T extends object,
  Immediate extends Readonly<boolean> = false
>(
  source: T,
  cb: WatchCallback<T, Immediate extends true ? T | undefined : T>,
  options?: WatchWithFilterOptions<Immediate>
): PausableWatchReturn
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/shared/pausableWatch/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/shared/pausableWatch/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/shared/pausableWatch/index.md)


<!--FOOTER_ENDS-->
