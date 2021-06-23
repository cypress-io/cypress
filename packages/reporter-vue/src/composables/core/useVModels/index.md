---
category: Component
---

# useVModels

Shorthand for props v-model binding. Think it like `toRefs(props)` but changes will also trigger emit.

## Usage

```js
import { useVModels } from '@vueuse/core'

export default {
  props: {
    foo: String,
    bar: Number,
  },
  setup(props, { emit }) {
    const { foo, bar } = useVModels(props, emit)

    console.log(foo.value) // props.data
    foo.value = 'foo' // emit('update:foo', 'foo')
  },
}
```

## Related

- `useVModel`


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
/**
 * Shorthand for props v-model binding. Think like `toRefs(props)` but changes will also emit out.
 *
 * @see https://vueuse.org/useVModels
 * @param props
 * @param emit
 */
export declare function useVModels<P extends object, Name extends string>(
  props: P,
  emit?: (name: Name, ...args: any[]) => void,
  options?: VModelOptions
): ToRefs<P>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useVModels/index.ts) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useVModels/index.md)


<!--FOOTER_ENDS-->
