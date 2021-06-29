---
category: Browser
---

# useMediaQuery

Reactive [Media Query](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries/Testing_media_queries). Once you've created a MediaQueryList object, you can check the result of the query or receive notifications when the result changes.

## Usage

```js
import { useMediaQuery } from '@vueuse/core'

const isLargeScreen = useMediaQuery('(min-width: 1024px)')
const isPreferredDark = useMediaQuery('(prefers-color-scheme: dark)')
```


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
/**
 * Reactive Media Query.
 *
 * @see https://vueuse.org/useMediaQuery
 * @param query
 * @param options
 */
export declare function useMediaQuery(
  query: string,
  options?: ConfigurableWindow
): Ref<boolean>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useMediaQuery/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useMediaQuery/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useMediaQuery/index.md)


<!--FOOTER_ENDS-->
