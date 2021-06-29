---
category: Utilities
---

# useDebounceFn

Debounce execution of a function.
>
> Debounce is an overloaded waiter: if you keep asking him your requests will be ignored until you stop and give him some time to think about your latest inquiry.

## Usage

```js
import { useDebounceFn } from '@vueuse/core'

const debouncedFn = useDebounceFn(() => {
  // do something
}, 1000)

document.addEventLisenter('resize', debouncedFn)
```

## Related Functions

- `useThrottle`
- `useThrottleFn`
- `useDebounce`
- `useDebounceFn`

## Recommended Reading

- [**Debounce vs Throttle**: Definitive Visual Guide](https://redd.one/blog/debounce-vs-throttle)


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
/**
 * Debounce execution of a function.
 *
 * @param  fn          A function to be executed after delay milliseconds debounced.
 * @param  ms          A zero-or-greater delay in milliseconds. For event callbacks, values around 100 or 250 (or even higher) are most useful.
 *
 * @return A new, debounce, function.
 */
export declare function useDebounceFn<T extends FunctionArgs>(
  fn: T,
  ms?: MaybeRef<number>
): T
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/shared/useDebounceFn/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/shared/useDebounceFn/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/shared/useDebounceFn/index.md)


<!--FOOTER_ENDS-->
