---
category: Browser
---

# useClipboard

Reactive [Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API). Provides the ability to respond to clipboard commands (cut, copy, and paste) as well as to asynchronously read from and write to the system clipboard. Access to the contents of the clipboard is gated behind the Permissions API without user permission, reading or altering the clipboard contents is not permitted.

## Usage

```js
import { useClipboard } from '@vueuse/core'

const source = ref('Hello')
const { text, copy, copied, isSupported } = useClipboard({ source })
```

```html
<button @click='copy'>
  <!-- by default, `copied` will be reset in 1.5s -->
  <span v-if='!copied'>Copy</span>
  <span v-else>Copied!</span>
</button>
```

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface ClipboardOptions<Source> extends ConfigurableNavigator {
  /**
   * Enabled reading for clipboard
   *
   * @default true
   */
  read?: boolean
  /**
   * Copy source
   */
  source?: Source
  /**
   * Milliseconds to reset state of `copied` ref
   *
   * @default 1500
   */
  copiedDuring?: number
}
export interface ClipboardReturn<Optional> {
  isSupported: boolean
  text: ComputedRef<string>
  copied: ComputedRef<boolean>
  copy: Optional extends true
    ? (text?: string) => Promise<void>
    : (text: string) => Promise<void>
}
/**
 * Reactive Clipboard API.
 *
 * @see https://vueuse.org/useClipboard
 * @param options
 */
export declare function useClipboard(
  options?: ClipboardOptions<undefined>
): ClipboardReturn<false>
export declare function useClipboard(
  options: ClipboardOptions<MaybeRef<string>>
): ClipboardReturn<true>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useClipboard/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useClipboard/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useClipboard/index.md)


<!--FOOTER_ENDS-->
