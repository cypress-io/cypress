---
category: Sensors
---

# onKeyStroke

Listen for keyboard key being stroked.

## Usage

```js
import { onKeyStroke } from '@vueuse/core'

onKeyStroke('ArrowDown', (e) => {
  e.preventDefault()
})
```

See [this table](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values) for all key codes.

### Custom Event Target

```js
onKeyStroke('A', (e) => {
  console.log('Key A pressed on document')
}, { target: document })
```

### Custom Keyboard Event

```js
onKeyStroke('Shift', (e) => {
  console.log('Shift key up')
}, { eventName: 'keyUp' })
```

Or

```js
onKeyUp('Shift', () => console.log('Shift key up'))
```


## Alias

- `onKeyDown` - alias for `onKeyStroke(key, handler, {eventName: 'keydown'})`
- `onKeyPressed` - alias for `onKeyStroke(key, handler, {eventName: 'keypress'})`
- `onKeyUp` -  alias for `onKeyStroke(key, handler, {eventName: 'keyup'})`

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export declare type KeyPredicate = (event: KeyboardEvent) => boolean
export declare type KeyFilter = null | undefined | string | KeyPredicate
export declare type KeyStrokeEventName = "keydown" | "keypress" | "keyup"
export declare type KeyStrokeOptions = {
  eventName?: KeyStrokeEventName
  target?: MaybeRef<EventTarget>
  passive?: boolean
}
/**
 * Listen for keyboard keys being stroked.
 *
 * @see https://vueuse.org/onKeyStroke
 * @param key
 * @param handler
 * @param options
 */
export declare function onKeyStroke(
  key: KeyFilter,
  handler: (event: KeyboardEvent) => void,
  options?: KeyStrokeOptions
): Fn
/**
 * Listen to the keydown event of the given key.
 *
 * @see https://vueuse.org/onKeyStroke
 * @param key
 * @param handler
 * @param options
 */
export declare function onKeyDown(
  key: KeyFilter,
  handler: (event: KeyboardEvent) => void,
  options?: Omit<KeyStrokeOptions, "eventName">
): Fn
/**
 * Listen to the keypress event of the given key.
 *
 * @see https://vueuse.org/onKeyStroke
 * @param key
 * @param handler
 * @param options
 */
export declare function onKeyPressed(
  key: KeyFilter,
  handler: (event: KeyboardEvent) => void,
  options?: Omit<KeyStrokeOptions, "eventName">
): Fn
/**
 * Listen to the keyup event of the given key.
 *
 * @see https://vueuse.org/onKeyStroke
 * @param key
 * @param handler
 * @param options
 */
export declare function onKeyUp(
  key: KeyFilter,
  handler: (event: KeyboardEvent) => void,
  options?: Omit<KeyStrokeOptions, "eventName">
): Fn
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/onKeyStroke/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/onKeyStroke/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/onKeyStroke/index.md)


<!--FOOTER_ENDS-->
