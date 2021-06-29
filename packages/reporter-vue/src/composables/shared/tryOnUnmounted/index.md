---
category: Component
---

# tryOnUnmounted

Safe `onUnmounted`. Call `onUnmounted()` if it's inside a component lifecycle, if not, do nothing

## Usage

```js
import { tryOnUnmounted } from '@vueuse/core'

tryOnUnmounted(() => {

})
```


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
/**
 * Call onUnmounted() if it's inside a component lifecycle, if not, do nothing
 *
 * @param fn
 */
export declare function tryOnUnmounted(fn: Fn): void
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/shared/tryOnUnmounted/index.ts) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/shared/tryOnUnmounted/index.md)


<!--FOOTER_ENDS-->
