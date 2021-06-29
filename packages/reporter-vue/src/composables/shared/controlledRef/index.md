---
category: Utilities
---

# controlledRef

Fine-grained controls over ref and its reactivity. (Vue 3 Only)

## Usage

`controlledRef` uses `extendRef` to provide two extra functions `get` and `set` to have better control over when it should track/trigger the reactivity.

```ts
import { controlledRef } from '@vueuse/core'

let num = controlledRef(0)
const doubled = computed(() => num.value * 2)

// just like normal ref
num.value = 42
console.log(num.value) // 42
console.log(doubled.value) // 84

// set value without triggering the reactivity
num.set(30, false)
console.log(num.value) // 30
console.log(doubled.value) // 84 (doesn't update)

// get value without tracking the reactivity
watchEffect(() => {
  console.log(num.peek())
}) // 30

num.value = 50 // watch effect wouldn't be triggered since it collected nothing.
console.log(doubled.value) // 100 (updated again since it's a reactive set)
```

### `peek`, `lay`, `untrackedGet`, `silentSet`

We also provide some shorthands for doing the get/set without track/triggering the reactivity system. The following lines are equivalent.

```ts
const foo = controlledRef('foo')
```

```ts
// getting
foo.get(false)
foo.untrackedGet()
foo.peek() // an alias for `untrackedGet`
```

```ts
// setting
foo.set('bar', false)
foo.silentSet('bar')
foo.lay('bar') // an alias for `silentSet`
```

## Configurations

### `onBeforeChange()`

`onBeforeChange` option is offered to give control over if a new value should be accepted. For example:

```ts
const num = controlledRef(0, {
  onBeforeChange(value, oldValue) {
    // disallow changes larger then ±5 in one operation
    if (Math.abs(value - oldValue) > 5)
      return false // returning `false` to dismiss the change
  },
})

num.value += 1
console.log(num.value) // 1

num.value += 6
console.log(num.value) // 1 (change been dismissed)
```

### `onChanged()`

`onChanged` option offers a similar functionally as Vue's `watch` but being synchronoused with less overhead compare to `watch`.

```ts
const num = controlledRef(0, {
  onChanged(value, oldValue) {
    console.log(value)
  }
})
```


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface ControlledRefOptions<T> {
  /**
   * Callback function before the ref changing.
   *
   * Returning `false` to dismiss the change.
   */
  onBeforeChange?: (value: T, oldValue: T) => void | boolean
  /**
   * Callback function after the ref changed
   *
   * This happends synchronously, with less overhead compare to `watch`
   */
  onChanged?: (value: T, oldValue: T) => void
}
/**
 * Explicitly define the deps of computed.
 *
 * @param source
 * @param fn
 */
export declare function controlledRef<T>(
  initial: T,
  options?: ControlledRefOptions<T>
): ShallowUnwrapRef<{
  get: (tracking?: boolean) => T
  set: (value: T, triggering?: boolean) => void
  untrackedGet: () => T
  silentSet: (v: T) => void
  peek: () => T
  lay: (v: T) => void
}> &
  Ref<T>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/shared/controlledRef/index.ts) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/shared/controlledRef/index.md)


<!--FOOTER_ENDS-->
