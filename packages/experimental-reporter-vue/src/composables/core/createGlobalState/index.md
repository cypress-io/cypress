---
category: State
---

# createGlobalState

Keep states in the global scope to be reusable across Vue instances.

## Usage

```js
// store.js
import { createGlobalState, useStorage } from '@vueuse/core'

export const useGlobalState = createGlobalState(
  () => useStorage('vue-use-local-storage'),
)
```

```js
// component.js
import { useGlobalState } from './store'

export default defineComponent({
  setup() {
    const state = useGlobalState()
    return { state }
  },
})
```


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
/**
 * Keep states in the global scope to be reusable across Vue instances.
 *
 * @see https://vueuse.org/createGlobalState
 * @param stateFactory A factory function to create the state
 */
export declare function createGlobalState<T extends object>(
  stateFactory: () => T
): () => T
export declare type CreateGlobalStateReturn = ReturnType<
  typeof createGlobalState
>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/createGlobalState/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/createGlobalState/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/createGlobalState/index.md)


<!--FOOTER_ENDS-->
