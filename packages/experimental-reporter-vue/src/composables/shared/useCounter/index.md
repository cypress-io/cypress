---
category: Utilities
---

# useCounter

Basic counter with utility functions.

## Usage

```js
import { useCounter } from '@vueuse/core'

const { count, inc, dec, set, reset } = useCounter()
```


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
/**
 * Basic counter with utility functions.
 *
 * @see https://vueuse.org/useCounter
 * @param [initialValue=0]
 */
export declare function useCounter(initialValue?: number): {
  count: Ref<number>
  inc: (delta?: number) => number
  dec: (delta?: number) => number
  get: () => number
  set: (val: number) => number
  reset: (val?: number) => number
}
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/shared/useCounter/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/shared/useCounter/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/shared/useCounter/index.md)


<!--FOOTER_ENDS-->
