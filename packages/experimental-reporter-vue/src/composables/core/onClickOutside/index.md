---
category: Sensors
---

# onClickOutside

Listen for clicks outside of an element. Useful for modal or dropdown.

## Usage

```html {18}
<template>
  <div ref="target">
    Hello world
  </div>
  <div>
    Outside element
  </div>
</template>

<script>
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'

export default {
  setup() {
    const target = ref(null)

    onClickOutside(target, (event) => console.log(event))

    return { target }
  }
}
</script>
```

## Component

```html
<OnClickOutside @trigger="count++">
  <div>
    Click Outside of Me
  </div>
</OnClickOutside>
```

<LearnMoreComponents />

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export declare type OnClickOutsideEvents = Pick<
  WindowEventMap,
  | "mousedown"
  | "mouseup"
  | "touchstart"
  | "touchend"
  | "pointerdown"
  | "pointerup"
>
export interface OnClickOutsideOptions<E extends keyof OnClickOutsideEvents>
  extends ConfigurableWindow {
  event?: E
}
/**
 * Listen for clicks outside of an element.
 *
 * @see https://vueuse.org/onClickOutside
 * @param target
 * @param handler
 * @param options
 */
export declare function onClickOutside<
  E extends keyof OnClickOutsideEvents = "pointerdown"
>(
  target: MaybeElementRef,
  handler: (evt: OnClickOutsideEvents[E]) => void,
  options?: OnClickOutsideOptions<E>
): Fn | undefined
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/onClickOutside/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/onClickOutside/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/onClickOutside/index.md)


<!--FOOTER_ENDS-->
