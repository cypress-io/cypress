---
category: Browser
---

# useScriptTag

Script tag injecting.

## Usage

```js
import { useScriptTag } from '@vueuse/core'

useScriptTag(
  'https://player.twitch.tv/js/embed/v1.js',
  // on script tag loaded.
  (el: HTMLScriptElement) => {
    // do something
  },
)
```

The script will be automatically loaded on the component mounted and removed when the component on unmounting.

## Configurations

Set `manual: true` to have manual control over the timing to load the script.

```ts
import { useScriptTag } from '@vueuse/core'

const { scriptTag, load, unload } = useScriptTag(
  'https://player.twitch.tv/js/embed/v1.js',
  () => {
    // do something
  },
  { manual: true },
)

// manual controls
await load()
await unload()
```

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface UseScriptTagOptions extends ConfigurableDocument {
  /**
   * Load the script immediately
   *
   * @default true
   */
  immediate?: boolean
  /**
   * Add `async` attribute to the script tag
   *
   * @default true
   */
  async?: boolean
  /**
   * Script type
   *
   * @default 'text/javascript'
   */
  type?: string
  /**
   * Manual controls the timing of loading and unloading
   *
   * @default false
   */
  manual?: boolean
  crossOrigin?: "anonymous" | "use-credentials"
  referrerPolicy?:
    | "no-referrer"
    | "no-referrer-when-downgrade"
    | "origin"
    | "origin-when-cross-origin"
    | "same-origin"
    | "strict-origin"
    | "strict-origin-when-cross-origin"
    | "unsafe-url"
  noModule?: boolean
  defer?: boolean
}
/**
 * Async script tag loading.
 *
 * @see https://vueuse.org/useScriptTag
 * @param src
 */
export declare function useScriptTag(
  src: MaybeRef<string>,
  onLoaded?: (el: HTMLScriptElement) => void,
  options?: UseScriptTagOptions
): {
  scriptTag: Ref<HTMLScriptElement | null>
  load: (waitForScriptLoad?: boolean) => Promise<HTMLScriptElement | boolean>
  unload: () => void
}
export declare type UseScriptTagReturn = ReturnType<typeof useScriptTag>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useScriptTag/index.ts) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useScriptTag/index.md)


<!--FOOTER_ENDS-->
