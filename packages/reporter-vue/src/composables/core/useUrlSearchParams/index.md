---
category: Browser
---

# useUrlSearchParams

Reactive [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)

## Usage

```html {19}
<template>
  <ul>
    <li v-for='key in Object.keys(params)' :key="key">
      { key }}={{ params[key] }}
    </li>
  </ul>
</template>

<script>
import { useUrlSearchParams } from '@vueuse/core'

export default {
  setup() {
    const params = useUrlSearchParams('history')
    params.foo = 'bar'
    params.vueuse = 'awesome'
    return { params }
  } 
}
</script>
```


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export declare type UrlParams = Record<string, string[] | string>
/**
 * Reactive URLSearchParams
 *
 * @see https://vueuse.org/useUrlSearchParams
 * @param mode
 * @param options
 */
export declare function useUrlSearchParams<
  T extends Record<string, any> = UrlParams
>(mode?: "history" | "hash", options?: ConfigurableWindow): T
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useUrlSearchParams/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useUrlSearchParams/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useUrlSearchParams/index.md)


<!--FOOTER_ENDS-->
