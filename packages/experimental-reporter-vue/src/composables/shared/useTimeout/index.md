---
category: Animation
---

# useTimeout

Update value after a given time with controls.

## Usage

```js
import { useTimeout, promiseTimeout } from '@vueuse/core'

const ready = useTimeout(1000)
```

```js
const { ready, start, stop } = useTimeout(1000, { controls: true })
```

```js
console.log(ready.value) // false

await promisedTimeout(1200)

console.log(ready.value) // true
```


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface TimeoutOptions<Controls extends boolean>
  extends TimeoutFnOptions {
  /**
   * Expose more controls
   *
   * @default false
   */
  controls?: Controls
}
/**
 * Update value after a given time with controls.
 *
 * @see   {@link https://vueuse.org/useTimeout}
 * @param interval
 * @param immediate
 */
export declare function useTimeout(
  interval?: number,
  options?: TimeoutOptions<false>
): ComputedRef<boolean>
export declare function useTimeout(
  interval: number,
  options: TimeoutOptions<true>
): {
  ready: ComputedRef<boolean>
} & Stopable
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/shared/useTimeout/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/shared/useTimeout/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/shared/useTimeout/index.md)


<!--FOOTER_ENDS-->
