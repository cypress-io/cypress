---
category: Sensors
---

# useSwipe

Reactive swipe detection based on [`TouchEvents`](https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent).

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
    const { isSwiping, direction } = useSwipe(el)

    return { el, isSwiping, direction }
  } 
</script>
```

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export declare enum SwipeDirection {
  UP = "UP",
  RIGHT = "RIGHT",
  DOWN = "DOWN",
  LEFT = "LEFT",
  NONE = "NONE",
}
export interface SwipeOptions extends ConfigurableWindow {
  /**
   * Register events as passive
   *
   * @default true
   */
  passive?: boolean
  /**
   * @default 50
   */
  threshold?: number
  /**
   * Callback on swipe start
   */
  onSwipeStart?: (e: TouchEvent) => void
  /**
   * Callback on swipe moves
   */
  onSwipe?: (e: TouchEvent) => void
  /**
   * Callback on swipe ends
   */
  onSwipeEnd?: (e: TouchEvent, direction: SwipeDirection) => void
}
export interface SwipeReturn {
  isPassiveEventSupported: boolean
  isSwiping: Ref<boolean>
  direction: ComputedRef<SwipeDirection | null>
  coordsStart: {
    readonly x: number
    readonly y: number
  }
  coordsEnd: {
    readonly x: number
    readonly y: number
  }
  lengthX: ComputedRef<number>
  lengthY: ComputedRef<number>
  stop: () => void
}
/**
 * Reactive swipe detection.
 *
 * @see https://vueuse.org/useSwipe
 * @param target
 * @param options
 */
export declare function useSwipe(
  target: MaybeRef<EventTarget | null | undefined>,
  options?: SwipeOptions
): SwipeReturn
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useSwipe/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useSwipe/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useSwipe/index.md)


<!--FOOTER_ENDS-->
