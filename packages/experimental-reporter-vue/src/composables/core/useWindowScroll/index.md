---
category: Sensors
---

# useWindowScroll

Reactive window scroll

## Usage

```js
import { useWindowScroll } from '@vueuse/core'

const { x, y } = useWindowScroll()
```


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
/**
 * Reactive window scroll.
 *
 * @see https://vueuse.org/useWindowScroll
 * @param options
 */
export declare function useWindowScroll({ window }?: ConfigurableWindow): {
  x: Ref<number>
  y: Ref<number>
}
export declare type UseWindowScrollReturn = ReturnType<typeof useWindowScroll>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useWindowScroll/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useWindowScroll/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useWindowScroll/index.md)


<!--FOOTER_ENDS-->
