---
category: Sensors
---

# useElementBounding

Reactive [bounding box](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect) of an HTML element

## Usage

```html
<template>
  <div ref="el" />
</template>

<script>
import { ref } from 'vue'
import { useElementBounding } from '@vueuse/core'

export default {
  setup() {
    const el = ref(null)
    const { x, y, top, right, bottom, left, width, height } = useElementBounding(el)

    return {
      el,
      /* ... */
    }
  }
})
</script>
```

## Component

```html
<UseElementBounding v-slot="{ width, height }">
  Width: {{ width }}
  Height: {{ height }}
</UseElementBounding>
```

<LearnMoreComponents />

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
/**
 * Reactive size of an HTML element.
 *
 * @see https://vueuse.org/useElementSize
 * @param target
 * @param callback
 * @param options
 */
export declare function useElementBounding(
  target: MaybeElementRef,
  options?: ResizeObserverOptions
): {
  x: Ref<number>
  y: Ref<number>
  top: Ref<number>
  right: Ref<number>
  bottom: Ref<number>
  left: Ref<number>
  width: Ref<number>
  height: Ref<number>
}
export declare type UseElementBoundingReturn = ReturnType<
  typeof useElementBounding
>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useElementBounding/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useElementBounding/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useElementBounding/index.md)


<!--FOOTER_ENDS-->
