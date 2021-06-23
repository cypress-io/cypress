---
category: Animation
---

# useTimeoutFn

Wrapper for `setTimeout` with controls.

```js
import { useTimeoutFn } from '@vueuse/core'

const { isPending, start, stop } = useTimeoutFn(() => {
  /* ... */
}, 3000)
```


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface TimeoutFnOptions {
  /**
   * Execute the callback immediate after calling this function
   *
   * @default true
   */
  immediate?: boolean
}
/**
 * Wrapper for `setTimeout` with controls.
 *
 * @param cb
 * @param interval
 * @param immediate
 */
export declare function useTimeoutFn(
  cb: (...args: unknown[]) => any,
  interval: MaybeRef<number>,
  options?: TimeoutFnOptions
): Stopable
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/shared/useTimeoutFn/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/shared/useTimeoutFn/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/shared/useTimeoutFn/index.md)


<!--FOOTER_ENDS-->
