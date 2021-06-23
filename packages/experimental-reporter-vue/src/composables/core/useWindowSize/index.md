---
category: Sensors
---

# useWindowSize

Reactive window size

## Usage

```js
import { useWindowSize } from '@vueuse/core'

const { width, height } = useWindowSize()
```

## Component

```html
<UseWindowSize v-slot="{ width, height }">
  Width: {{ width }}
  Height: {{ height }}
</UseWindowSize>
```

<LearnMoreComponents />

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface WindowSizeOptions extends ConfigurableWindow {
  initialWidth?: number
  initialHeight?: number
}
/**
 * Reactive window size.
 *
 * @see https://vueuse.org/useWindowSize
 * @param options
 */
export declare function useWindowSize({
  window,
  initialWidth,
  initialHeight,
}?: WindowSizeOptions): {
  width: Ref<number>
  height: Ref<number>
}
export declare type UseWindowSizeReturn = ReturnType<typeof useWindowSize>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useWindowSize/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useWindowSize/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useWindowSize/index.md)


<!--FOOTER_ENDS-->
