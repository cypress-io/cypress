---
category: Utilities
---

# useThrottleFn

Throttle execution of a function. Especially useful for rate limiting execution of handlers on events like resize and scroll.
>
> Throttle is a spring that throws balls: after a ball flies out it needs some time to shrink back, so it cannot throw any more balls unless it's ready.

## Usage

```js
import { useThrottleFn } from '@vueuse/core'

const throttledFn = useThrottleFn(() => {
  // do something, it will be called at most 1 time per second
}, 1000)

document.addEventLisenter('resize', throttledFn)
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
 * Throttle execution of a function. Especially useful for rate limiting
 * execution of handlers on events like resize and scroll.
 *
 * @param   fn             A function to be executed after delay milliseconds. The `this` context and all arguments are passed through, as-is,
 *                                    to `callback` when the throttled-function is executed.
 * @param   ms             A zero-or-greater delay in milliseconds. For event callbacks, values around 100 or 250 (or even higher) are most useful.
 *
 * @return  A new, throttled, function.
 */
export declare function useThrottleFn<T extends FunctionArgs>(
  fn: T,
  ms?: MaybeRef<number>,
  trailing?: boolean
): T
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/shared/useThrottleFn/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/shared/useThrottleFn/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/shared/useThrottleFn/index.md)


<!--FOOTER_ENDS-->
