---
category: Sensors
---

# useElementSize

Reactive size of an HTML element. [ResizeObserver MDN](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)

## Usage

```html
<template>
  <div ref="el">
    Height: {{ height }}
    Width: {{ Width }}
  </div>
</template>

<script>
import { ref } from 'vue'
import { useElementSize } from '@vueuse/core'

export default {
  setup() {
    const el = ref(null)
    const { width, height } = useElementSize(el)

    return {
      el,
      width,
      height,
    }
  }
})
</script>
```

## Component

```html
<UseElementSize v-slot="{ width, height }">
  Width: {{ width }}
  Height: {{ height }}
</UseElementSize>
```

<LearnMoreComponents />


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface ElementSize {
  width: number
  height: number
}
/**
 * Reactive size of an HTML element.
 *
 * @see https://vueuse.org/useElementSize
 * @param target
 * @param callback
 * @param options
 */
export declare function useElementSize(
  target: MaybeElementRef,
  initialSize?: ElementSize,
  options?: ResizeObserverOptions
): {
  width: Ref<number>
  height: Ref<number>
}
export declare type UseElementSizeReturn = ReturnType<typeof useElementSize>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useElementSize/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useElementSize/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useElementSize/index.md)


<!--FOOTER_ENDS-->
