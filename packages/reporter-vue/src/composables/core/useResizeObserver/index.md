---
category: Sensors
---

# useResizeObserver

Reports changes to the dimensions of an Element's content or the border-box

## Usage

```html {16-20}
<template>
  <div ref="el">
    {{text}}
  </div>
</template>

<script>
import { ref } from 'vue'
import { useResizeObserver } from '@vueuse/core'

export default {
  setup() {
    const el = ref(null)
    const text = ref('')

    useResizeObserver(el, (entries) => {
      const entry = entries[0]
      const { width, height } = entry.contentRect
      text.value = `width: ${width}, height: ${height}`
    })

    return {
      el,
      text,
    }
  }
})
</script>
```

[ResizeObserver MDN](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface ResizeObserverSize {
  readonly inlineSize: number
  readonly blockSize: number
}
export interface ResizeObserverEntry {
  readonly target: Element
  readonly contentRect: DOMRectReadOnly
  readonly borderBoxSize?: ReadonlyArray<ResizeObserverSize>
  readonly contentBoxSize?: ReadonlyArray<ResizeObserverSize>
  readonly devicePixelContentBoxSize?: ReadonlyArray<ResizeObserverSize>
}
export declare type ResizeObserverCallback = (
  entries: ReadonlyArray<ResizeObserverEntry>,
  observer: ResizeObserver
) => void
export interface ResizeObserverOptions extends ConfigurableWindow {
  /**
   * Sets which box model the observer will observe changes to. Possible values
   * are `content-box` (the default), and `border-box`.
   *
   * @default 'content-box'
   */
  box?: "content-box" | "border-box"
}
declare class ResizeObserver {
  constructor(callback: ResizeObserverCallback)
  disconnect(): void
  observe(target: Element, options?: ResizeObserverOptions): void
  unobserve(target: Element): void
}
/**
 * Reports changes to the dimensions of an Element's content or the border-box
 *
 * @see https://vueuse.org/useResizeObserver
 * @param target
 * @param callback
 * @param options
 */
export declare function useResizeObserver(
  target: MaybeElementRef,
  callback: ResizeObserverCallback,
  options?: ResizeObserverOptions
): {
  isSupported: boolean | undefined
  stop: () => void
}
export declare type UseResizeObserverReturn = ReturnType<
  typeof useResizeObserver
>
export {}
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useResizeObserver/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useResizeObserver/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useResizeObserver/index.md)


<!--FOOTER_ENDS-->
