---
category: Utilities
---

# useToggle

A boolean switcher with utility functions.

## Usage

```js
import { useToggle } from '@vueuse/core'

const [value, toggle] = useToggle()
```

When you pass a ref, `useToggle` will return a simple toggle function instead:

```js
import { useDark, useToggle } from '@vueuse/core'

const isDark = useDark()
const toggleDark = useToggle(isDark)
```

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
/**
 * A boolean ref with a toggler
 *
 * @see https://vueuse.org/useToggle
 * @param [initialValue=false]
 */
export declare function useToggle(value: Ref<boolean>): () => boolean
export declare function useToggle(
  initialValue?: boolean
): [Ref<boolean>, () => boolean]
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/shared/useToggle/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/shared/useToggle/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/shared/useToggle/index.md)


<!--FOOTER_ENDS-->
