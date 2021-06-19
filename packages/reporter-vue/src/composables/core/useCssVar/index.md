---
category: Browser
---

# useCssVar

Manipulate CSS variables

## Usage

```js
import { useCssVar } from '@vueuse/core'

const el = ref(null)
const color = useCssVar('--color', el)
```


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
/**
 * Manipulate CSS variables.
 *
 * @see https://vueuse.org/useCssVar
 * @param prop
 * @param el
 * @param options
 */
export declare function useCssVar(
  prop: string,
  target?: MaybeElementRef,
  { window }?: ConfigurableWindow
): Ref<string>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useCssVar/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useCssVar/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useCssVar/index.md)


<!--FOOTER_ENDS-->
