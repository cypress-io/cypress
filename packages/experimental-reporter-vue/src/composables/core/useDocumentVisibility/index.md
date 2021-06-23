---
category: Sensors
---

# useDocumentVisibility

Reactively track [`document.visibilityState`](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilityState)

## Usage

```js
import { useDocumentVisibility } from '@vueuse/core'

const visibility = useDocumentVisibility()
```

## Component
```html
<UseDocumentVisibility v-slot="{ visibility }">
  Document Visibility: {{ visibility }}
</UseDocumentVisibility>
```

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
/**
 * Reactively track `document.visibilityState`.
 *
 * @see https://vueuse.org/useDocumentVisibility
 * @param options
 */
export declare function useDocumentVisibility({
  document,
}?: ConfigurableDocument): Ref<VisibilityState>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useDocumentVisibility/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useDocumentVisibility/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useDocumentVisibility/index.md)


<!--FOOTER_ENDS-->
