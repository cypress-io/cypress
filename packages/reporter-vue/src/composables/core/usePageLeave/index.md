---
category: Sensors
---

# usePageLeave

Reactive state to show whether the mouse leaves the page.

## Usage

```js
import { usePageLeave } from '@vueuse/core'

const isLeft = usePageLeave()
```

## Component
```html
<UsePageLeave v-slot="{ isLeft }">
  Has Left Page: {{ isLeft }}
<UsePageLeave>
```

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
/**
 * Reactive state to show whether mouse leaves the page.
 *
 * @see https://vueuse.org/usePageLeave
 * @param options
 */
export declare function usePageLeave(options?: ConfigurableWindow): Ref<boolean>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/usePageLeave/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/usePageLeave/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/usePageLeave/index.md)


<!--FOOTER_ENDS-->
