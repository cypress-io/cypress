---
category: Browser
---

# useFullscreen

Reactive [Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API). It adds methods to present a specific Element (and its descendants) in full-screen mode, and to exit full-screen mode once it is no longer needed. This makes it possible to present desired content—such as an online game—using the user's entire screen, removing all browser user interface elements and other applications from the screen until full-screen mode is shut off.

## Usage

```js
import { useFullscreen } from '@vueuse/core'

const { isFullscreen, enter, exit, toggle } = useFullscreen()
```

Fullscreen specified element

```ts
const el = ref<HTMLElement | null>(null)

const { isFullscreen, enter, exit, toggle } = useFullscreen(el)
```

```html
<video ref='el'>
```

## Component

```html
<UseFullscreen v-slot="{ toggle }">
  <video />
  <button @click="toggle">
    Go Fullscreen
  </button>
</UseFullscreen>
```

<LearnMoreComponents />


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
/**
 * Reactive Fullscreen API.
 *
 * @see https://vueuse.org/useFullscreen
 * @param target
 * @param options
 */
export declare function useFullscreen(
  target?: MaybeElementRef,
  options?: ConfigurableDocument
): {
  isSupported: boolean
  isFullscreen: Ref<boolean>
  enter: () => Promise<void>
  exit: () => Promise<void>
  toggle: () => Promise<void>
}
export declare type UseFullscreenReturn = ReturnType<typeof useFullscreen>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useFullscreen/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useFullscreen/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useFullscreen/index.md)


<!--FOOTER_ENDS-->
