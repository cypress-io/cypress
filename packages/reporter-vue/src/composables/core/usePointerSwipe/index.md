---
category: Sensors
---

# usePointerSwipe

Reactive swipe detection based on [PointerEvents](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent).

## Usage

```html {16-20}
<template>
  <div ref="el">
    Swipe here
  </div>
</template>

<script>
  setup() {
    const el = ref(null)
    const { isSwiping, direction } = usePointerSwipe(el)

    return { el, isSwiping, direction }
  } 
</script>
```


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface PointerSwipeOptions {
  /**
   * @default 50
   */
  threshold?: number
  /**
   * Callback on swipe start
   */
  onSwipeStart?: (e: PointerEvent) => void
  /**
   * Callback on swipe move
   */
  onSwipe?: (e: PointerEvent) => void
  /**
   * Callback on swipe end
   */
  onSwipeEnd?: (e: PointerEvent, direction: SwipeDirection) => void
}
export interface PointerPosition {
  x: number
  y: number
}
export interface PointerSwipeReturn {
  readonly isSwiping: Ref<boolean>
  direction: ComputedRef<SwipeDirection | null>
  readonly posStart: PointerPosition
  readonly posEnd: PointerPosition
  distanceX: ComputedRef<number>
  distanceY: ComputedRef<number>
  stop: () => void
}
/**
 * Reactive swipe detection based on PointerEvents.
 *
 * @see https://vueuse.org/usePointerSwipe
 * @param target
 * @param options
 */
export declare function usePointerSwipe(
  target: MaybeRef<Element | null | undefined>,
  options?: PointerSwipeOptions
): PointerSwipeReturn
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/usePointerSwipe/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/usePointerSwipe/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/usePointerSwipe/index.md)


<!--FOOTER_ENDS-->
