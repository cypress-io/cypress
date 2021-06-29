---
category: Browser
---

# useBreakpoints

Reactive viewport breakpoints

## Usage

```js
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'

const breakpoints = useBreakpoints(breakpointsTailwind)

const smAndLarger = breakpoints.greater('sm')
```

```js
import { useBreakpoints } from '@vueuse/core'

const breakpoints = useBreakpoints({
  tablet: 640,
  laptop: 1024,
  desktop: 1280,
})

const laptop = breakpoints.between('laptop', 'desktop')
```


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export * from "./breakpoints"
export declare type Breakpoints<K extends string = string> = Record<
  K,
  number | string
>
/**
 * Reactively viewport breakpoints
 *
 * @see https://vueuse.org/useBreakpoints
 * @param options
 */
export declare function useBreakpoints<K extends string>(
  breakpoints: Breakpoints<K>,
  options?: ConfigurableWindow
): {
  greater(k: K): Ref<boolean>
  smaller(k: K): Ref<boolean>
  between(a: K, b: K): Ref<boolean>
  isGreater(k: K): boolean
  isSmaller(k: K): boolean
  isInBetween(a: K, b: K): boolean
}
export declare type UseBreakpointsReturn = ReturnType<typeof useBreakpoints>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useBreakpoints/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useBreakpoints/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useBreakpoints/index.md)


<!--FOOTER_ENDS-->
