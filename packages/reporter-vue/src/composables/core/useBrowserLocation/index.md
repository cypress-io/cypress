---
category: Browser
---

# useBrowserLocation

Reactive browser location

## Usage

```js
import { useBrowserLocation } from '@vueuse/core'

const location = useBrowserLocation()
```

## Component

```html
<UseBrowserLocation v-slot="{ location }">
  Browser Location: {{ location }}
</UseBrowserLocation>
```

<LearnMoreComponents />


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface BrowserLocationState {
  trigger: string
  state?: any
  length?: number
  hash?: string
  host?: string
  hostname?: string
  href?: string
  origin?: string
  pathname?: string
  port?: string
  protocol?: string
  search?: string
}
/**
 * Reactive browser location.
 *
 * @see https://vueuse.org/useBrowserLocation
 * @param options
 */
export declare function useBrowserLocation({
  window,
}?: ConfigurableWindow): Ref<{
  trigger: string
  state?: any
  length?: number | undefined
  hash?: string | undefined
  host?: string | undefined
  hostname?: string | undefined
  href?: string | undefined
  origin?: string | undefined
  pathname?: string | undefined
  port?: string | undefined
  protocol?: string | undefined
  search?: string | undefined
}>
export declare type UseBrowserLocationReturn = ReturnType<
  typeof useBrowserLocation
>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useBrowserLocation/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useBrowserLocation/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useBrowserLocation/index.md)


<!--FOOTER_ENDS-->
