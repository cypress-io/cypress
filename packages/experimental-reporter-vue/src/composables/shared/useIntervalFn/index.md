---
category: Animation
---

# useIntervalFn

Wrapper for `setInterval` with controls

## Usage

```js
import { useIntervalFn } from '@vueuse/core'

const { start, stop } = useIntervalFn(() => {
  /* your function */
}, 1000)
```


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface IntervalFnOptions {
  /**
   * Execute the callback immediate after calling this function
   *
   * @default true
   */
  immediate?: boolean
}
/**
 * Wrapper for `setInterval` with controls
 *
 * @param cb
 * @param interval
 * @param options
 */
export declare function useIntervalFn(
  cb: Fn,
  interval?: number,
  options?: IntervalFnOptions
): Pausable
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/shared/useIntervalFn/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/shared/useIntervalFn/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/shared/useIntervalFn/index.md)


<!--FOOTER_ENDS-->
