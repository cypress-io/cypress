---
category: Browser
---

# useActiveElement

Reactive `document.activeElement`

## Usage

```js
import { useActiveElement } from '@vueuse/core'

const activeElement = useActiveElement()

watch(activeElement, (el) => {
  console.log('focus changed to', el)
})
```

## Component

```html
<UseActiveElement v-slot="{ element }">
  Active element is {{ element.dataset.id }}
</UseActiveElement>
```

<LearnMoreComponents />

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
/**
 * Reactive `document.activeElement`
 *
 * @see https://vueuse.org/useActiveElement
 * @param options
 */
export declare function useActiveElement<T extends HTMLElement>(
  options?: ConfigurableWindow
): ComputedRef<T | null | undefined>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useActiveElement/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useActiveElement/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useActiveElement/index.md)


<!--FOOTER_ENDS-->
