---
category: Browser
---

# usePreferredDark

Reactive dark theme preference.

## Usage

```js
import { usePreferredDark } from '@vueuse/core'

const isDark = usePreferredDark()
```

## Component

```html
<UsePreferredDark v-slot="{ prefersDark }">
  Prefers Dark: {{ prefersDark }}
</UsePreferredDark>
```

<LearnMoreComponents />

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
/**
 * Reactive dark theme preference.
 *
 * @see https://vueuse.org/usePreferredDark
 * @param [options]
 */
export declare function usePreferredDark(
  options?: ConfigurableWindow
): Ref<boolean>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/usePreferredDark/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/usePreferredDark/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/usePreferredDark/index.md)


<!--FOOTER_ENDS-->
