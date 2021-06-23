---
category: Sensors
---

# useMousePressed

Reactive mouse pressing state. Triggered by `mousedown` `touchstart` on target element and released by `mouseup` `mouseleave` `touchend` `touchcancel` on window.

## Basic Usage

```js
import { useMousePressed } from '@vueuse/core'

const { pressed } = useMousePressed()
```

Touching is enabled by default. To make it only detects mouse changes, set `touch` to `false`

```js
const { pressed } = useMousePressed({ touch: false })
```

To only capture `mousedown` and `touchstart` on specific element, you can specify `target` by passing a ref of the element. 


```html {16-20}
<template>
  <div ref="el">
    Only clicking on this element will trigger the update.
  </div>
</template>

<script>
import { ref } from 'vue'
import { useMousePressed } from '@vueuse/core'

export default {
  setup() {
    const el = ref(null)

    const { pressed } = useMousePressed({ target: el })

    return {
      el,
      pressed,
    }
  }
})
</script>
```

## Component

```html
<UseMousePressed v-slot="{ pressed }">
  Is Pressed: {{ pressed }}
</UseMousePressed>
```

<LearnMoreComponents />


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface MousePressedOptions extends ConfigurableWindow {
  /**
   * Listen to `touchstart` `touchend` events
   *
   * @default true
   */
  touch?: boolean
  /**
   * Initial values
   *
   * @default false
   */
  initialValue?: boolean
  /**
   * Element target to be capture the click
   */
  target?: MaybeElementRef
}
/**
 * Reactive mouse position.
 *
 * @see https://vueuse.org/useMousePressed
 * @param options
 */
export declare function useMousePressed(options?: MousePressedOptions): {
  pressed: Ref<boolean>
  sourceType: Ref<MouseSourceType>
}
export declare type UseMousePressedReturn = ReturnType<typeof useMousePressed>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useMousePressed/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useMousePressed/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useMousePressed/index.md)


<!--FOOTER_ENDS-->
