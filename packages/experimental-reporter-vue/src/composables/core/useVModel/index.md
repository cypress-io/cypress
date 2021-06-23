---
category: Component
---

# useVModel

Shorthand for v-model binding, props + emit -> ref

## Usage

```js
import { useVModel } from '@vueuse/core'

export default {
  setup(props, { emit }) {
    const data = useVModel(props, 'data', emit)

    console.log(data.value) // props.data
    data.value = 'foo' // emit('update:data', 'foo')
  },
}
```


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface VModelOptions {
  /**
   * When passive is set to `true`, it will use `watch` to sync with props and ref.
   * Instead of relying on the `v-model` or `.sync` to work.
   *
   * @default false
   */
  passive?: boolean
  /**
   * When eventName is set, it's value will be used to overwrite the emit event name.
   *
   * @default undefined
   */
  eventName?: string
}
/**
 * Shorthand for v-model binding, props + emit -> ref
 *
 * @see https://vueuse.org/useVModel
 * @param props
 * @param key (default 'value' in Vue 2 and 'modelValue' in Vue 3)
 * @param emit
 */
export declare function useVModel<
  P extends object,
  K extends keyof P,
  Name extends string
>(
  props: P,
  key?: K,
  emit?: (name: Name, ...args: any[]) => void,
  options?: VModelOptions
): Ref<UnwrapRef<P[K]>> | WritableComputedRef<P[K]>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useVModel/index.ts) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useVModel/index.md)


<!--FOOTER_ENDS-->
