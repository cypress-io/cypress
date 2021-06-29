---
category: Browser
---

# useFavicon

Reactive favicon

## Usage

```js {3}
import { useFavicon } from '@vueuse/core'

const icon = useFavicon()

icon.value = 'dark.png' // change current icon
```

### Passing a source ref

You can pass a `ref` to it, changes from of the source ref will be reflected to your favicon automatically.

```js {7}
import { computed } from 'vue'
import { useFavicon, usePreferredDark } from '@vueuse/core'

const isDark = usePreferredDark()
const favicon = computed(() => isDark.value ? 'dark.png' : 'light.png')

useFavicon(favicon)
```

When a source ref is passed, the return ref will be identical to the source ref

```ts
const source = ref('icon.png')
const icon = useFavicon(source)

console.log(icon === source) // true
```



<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface FaviconOptions extends ConfigurableDocument {
  baseUrl?: string
  rel?: string
}
/**
 * Reactive favicon.
 *
 * @see https://vueuse.org/useFavicon
 * @param newIcon
 * @param options
 */
export declare function useFavicon(
  newIcon?: MaybeRef<string | null | undefined>,
  options?: FaviconOptions
): Ref<string | null | undefined>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useFavicon/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useFavicon/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useFavicon/index.md)


<!--FOOTER_ENDS-->
