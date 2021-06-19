---
category: Utilities
---

# autoResetRef

A ref which will be reset to the default value after some time.

## Usage

```ts
import { autoResetRef } from '@vueuse/core'

const message = autoResetRef('default message', 1000)

const setMessage = () => {
  // here the value will change to 'message has set' but after 1000ms, it will change to 'default message'
  message.value = 'message has set'
}
```


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
/**
 * Create a ref which will be reset to the default value after some time.
 *
 * @see https://vueuse.org/autoResetRef
 * @param defaultValue The value which will be set.
 * @param afterMs      A zero-or-greater delay in milliseconds.
 */
export declare function autoResetRef<T>(
  defaultValue: T,
  afterMs?: MaybeRef<number>
): Ref<T>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/autoResetRef/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/autoResetRef/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/autoResetRef/index.md)


<!--FOOTER_ENDS-->
