---
category: Animation
---

# useRafFn

Call function on every `requestAnimationFrame`. With controls of pausing and resuming.

## Usage

```js
import { ref } from 'vue'
import { useRafFn } from '@vueuse/core'

const count = ref(0)

const { pause, resume } = useRafFn(() => {
  count.value++
  console.log(count.value)
})
```


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface RafFnOptions extends ConfigurableWindow {
  /**
   * Start the requestAnimationFrame loop immediately on creation
   *
   * @default true
   */
  immediate?: boolean
}
/**
 * Call function on every `requestAnimationFrame`. With controls of pausing and resuming.
 *
 * @see https://vueuse.org/useRafFn
 * @param fn
 * @param options
 */
export declare function useRafFn(fn: Fn, options?: RafFnOptions): Pausable
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useRafFn/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useRafFn/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useRafFn/index.md)


<!--FOOTER_ENDS-->
