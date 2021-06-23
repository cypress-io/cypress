---
category: Sensors
---

# useMagicKeys

Reactive keys pressed state, with magical keys combination support.

> This function uses [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) which is NOT supported by IE 11 or below.

## Usage

```js
import { useMagicKeys } from '@vueuse/core'

const { shift, space, a /* keys you want to monitor */ } = useMagicKeys()

watch(space, (v) => {
  if (v)
    console.log('space has been pressed')
})

watchEffect(() => {
  if (shift.value && a.value)
    console.log('Shift + A have been pressed')
})
```

Check out [all the possible keycodes](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values).

### Combinations

You can magically use combinations (shortcuts/hotkeys) by connecting keys with `+` or `_`.

```ts
import { useMagicKeys } from '@vueuse/core'

const keys = useMagicKeys()
const shiftCtrlA = keys['Shift+Ctrl+A']

watch(shiftCtrlA, (v) => {
  if (v)
    console.log('Shift + Ctrl + A have been pressed')
})
```

```ts
import { useMagicKeys } from '@vueuse/core'

const { Ctrl_A_B, space, alt_s, /* ... */ } = useMagicKeys()

watch(Ctrl_A_B, (v) => {
  if (v)
    console.log('Control+A+B have been pressed')
})
```

You can also use `whenever` function to make it shorter

```ts
import { useMagicKeys, whenever } from '@vueuse/core'

const keys = useMagicKeys()

whenever(keys.shift_space, () => {
  console.log('Shift+Space have been pressed')
})
```

### Current Pressed keys

A special property `current` is provided to representing all the keys been pressed currently.

```ts
import { useMagicKeys } from '@vueuse/core'

const { current } = useMagicKeys()

console.log(current) // Set { 'control', 'a' }

whenever(
  () => current.has('a') && !current.has('b'),
  () => console.log('A is pressed but not B')
)
```

### Key Aliasing

```ts
import { useMagicKeys, whenever } from '@vueuse/core'

const { shift_cool } = useMagicKeys({
  aliasMap: {
    cool: 'space'
  }
})

whenever(shift_cool, () => console.log('Shift + Space have been pressed'))
```

By default, we have some [preconfigured alias for common practices](https://github.com/vueuse/vueuse/blob/main/packages/core/useMagicKeys/aliasMap.ts).

### Conditionally Disable

You might have some `<input />` elements in your apps, and you don't want to trigger the magic keys handling when users focused on those inputs. There is an example of using `useActiveElement` and `and` to do that.

```ts
import { useMagicKeys, useActiveElement, whenever, and } from '@vueuse/core'

const activeElement = useActiveElement()
const notUsingInput = computed(() => 
  activeElement.value?.tagName !== 'INPUT'
  && activeElement.value?.tagName !== 'TEXTAREA'
)

const { tab } = useMagicKeys()

whenever(and(tab, notUsingInput), () => {
  console.log('Tab has been pressed outside of inputs!')
})
```

### Custom Event Handler

```ts
import { useMagicKeys, whenever } from '@vueuse/core'

const { ctrl_s } = useMagicKeys({
  passive: false,
  onEventFired(e) {
    if (e.ctrlKey && e.key === 's' && e.type === 'keydown') {
      e.preventDefault()
    }
  }
})

whenever(ctrl_s, () => console.log('Ctrl+S have been pressed'))
```

> ⚠️ This usage is NOT recommended, please use with caution.

### Reactive Mode

By default, the values of `useMagicKeys()` are `Ref<boolean>`. If you want to use the object in the template, you can set it to reactive mode.

```ts
const keys = useMagicKeys({ reactive: true })
```

```html
<template>
  <div v-if="keys.shift">
    You are holding the Shift key!
  <div>
</template>
```

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface UseMagicKeysOptions<Reactive extends Boolean> {
  /**
   * Returns a reactive object instead of an object of refs
   *
   * @default false
   */
  reactive?: Reactive
  /**
   * Target for listening events
   *
   * @default window
   */
  target?: MaybeRef<EventTarget>
  /**
   * Alias map for keys, all the keys should be lowercase
   * { target: keycode }
   *
   * @example { ctrl: "control" }
   * @default <predefined-map>
   */
  aliasMap?: Record<string, string>
  /**
   * Register passive listener
   *
   * @default true
   */
  passive?: boolean
  /**
   * Custom event handler for keydown/keyup event.
   * Useful when you want to apply custom logic.
   *
   * When using `e.preventDefault()`, you will need to pass `passive: false` to useMagicKeys().
   */
  onEventFired?: (e: KeyboardEvent) => void | boolean
}
export interface MagicKeysInternal {
  /**
   * A Set of currently pressed keys,
   * Stores raw keyCodes.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
   */
  current: Set<string>
}
export declare type MagicKeys<Reactive extends Boolean> = Readonly<
  Omit<
    Reactive extends true
      ? Record<string, boolean>
      : Record<string, ComputedRef<boolean>>,
    keyof MagicKeysInternal
  > &
    MagicKeysInternal
>
/**
 * Reactive keys pressed state, with magical keys combination support.
 *
 * @see https://vueuse.org/useMagicKeys
 */
export declare function useMagicKeys(
  options?: UseMagicKeysOptions<false>
): MagicKeys<false>
export declare function useMagicKeys(
  options: UseMagicKeysOptions<true>
): MagicKeys<true>
export { DefaultMagicKeysAliasMap } from "./aliasMap"
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useMagicKeys/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useMagicKeys/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useMagicKeys/index.md)


<!--FOOTER_ENDS-->
