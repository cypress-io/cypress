---
category: Animation
---

# useInterval

Reactive counter increases on every interval

## Usage

```js {4}
import { useInterval } from '@vueuse/core'

// count will increase every 200ms
const counter = useInterval(200)
```

```ts
const { counter, pause, resume } = useInterval(200, { controls: true })
```

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface IntervalOptions<Controls extends boolean> {
  /**
   * Expose more controls
   *
   * @default false
   */
  controls?: Controls
  /**
   * Exccute the update immediately on calling
   *
   * @default true
   */
  immediate?: boolean
}
export declare function useInterval(
  interval?: number,
  options?: IntervalOptions<false>
): Ref<number>
export declare function useInterval(
  interval: number,
  options: IntervalOptions<true>
): {
  counter: Ref<number>
} & Pausable
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/shared/useInterval/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/shared/useInterval/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/shared/useInterval/index.md)


<!--FOOTER_ENDS-->
