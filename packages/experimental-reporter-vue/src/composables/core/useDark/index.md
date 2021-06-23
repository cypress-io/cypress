---
category: Browser
---

# useDark

Reactive dark mode with auto data persistence.

## Basic Usage

```js
import { useDark, useToggle } from '@vueuse/core'

const isDark = useDark()
const toggleDark = useToggle(isDark)
```

## Behavior

`useDark` combines with `usePreferredDark` and `useStorage`. On start up, it reads the value from localStorage/sessionStorage(the key is configurable) to see if there is user configured color scheme, if not, it will use users' system preferences. When you change the `isDark` ref, it will update the corresponding element's attribute and then store the preference to storage for persistence.

> Please note `useDark` only handles the DOM attribute changes for you to apply proper selector in your CSS. It does NOT handle the actual style, theme or CSS for you.

## Configuration

By default, it uses [Tailwind CSS favored dark mode](https://tailwindcss.com/docs/dark-mode#toggling-dark-mode-manually), which enables dark mode when class `dark` is applied to the `html` tag, for example:

```html
<!--light-->
<html> ... </html>

<!--dark-->
<html class="dark"> ... </html>
```

While you can customize it and make it works for most the of the CSS frameworks.

For example:

```ts
const isDark = useDark({
  selector: 'body',
  attribute: 'color-scheme',
  valueDark: 'dark',
  valueLight: 'light'
})
```

will works like

```html
<!--light-->
<html>
  <body color-scheme="light"> ... </body>
</html>

<!--dark-->
<html>
  <body color-scheme="dark"> ... </body>
</html>
```

If the configuration above still not fitting to your needs, you can use `onChanged` options to take ful controls over how you handle the updates

```ts
const isDark = useDark({
  onChanged(dark: boolean) {
    // update the dom, call the API or something
  }
})
```

## Component
```html
<UseDark v-slot="{ isDark, toggleDark }">
  <button @click="toggleDark()">
    Is Dark: {{ isDark }}
  </button>
</UseDark>
```

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export declare type ColorSchemes = "light" | "dark" | "auto"
export interface UseDarkOptions extends StorageOptions<ColorSchemes> {
  /**
   * CSS Selector for the target element applying to
   *
   * @default 'html'
   */
  selector?: string
  /**
   * HTML attribute applying the target element
   *
   * @default 'class'
   */
  attribute?: string
  /**
   * Value applying to the target element when isDark=true
   *
   * @default 'dark'
   */
  valueDark?: string
  /**
   * Value applying to the target element when isDark=false
   *
   * @default ''
   */
  valueLight?: string
  /**
   * A custom handler for handle the updates.
   * When specified, the default behavior will be overridded.
   *
   * @default undefined
   */
  onChanged?: (isDark: boolean) => void
  /**
   * Key to persist the data into localStorage/sessionStorage.
   *
   * Pass `null` to disable persistence
   *
   * @default 'vueuse-color-scheme'
   */
  storageKey?: string | null
  /**
   * Storage object, can be localStorage or sessionStorage
   *
   * @default localStorage
   */
  storage?: StorageLike
}
/**
 * Reactive dark mode with auto data persistence.
 *
 * @see https://vueuse.org/useDark
 * @param options
 */
export declare function useDark(
  options?: UseDarkOptions
): WritableComputedRef<boolean>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useDark/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useDark/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useDark/index.md)


<!--FOOTER_ENDS-->
