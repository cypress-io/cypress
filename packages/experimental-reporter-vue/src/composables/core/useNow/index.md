---
category: Animation
---

# useNow

Reactive current Date instance.

## Usage

```js
import { useNow } from '@vueuse/core'

const now = useNow()
```

```js
const { now, pause, resume } = useNow({ controls: true })
```

## Component

```html
<UseNow v-slot="{ now, pause, resume }">
  Now: {{ now }}
  <button @click="pause()">Pause</button>
  <button @click="resume()">Resume</button>
</UseNow>
```

<LearnMoreComponents />

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface UseNowOptions<Controls extends boolean> {
  /**
   * Expose more controls
   *
   * @default false
   */
  controls?: Controls
  /**
   * Update interval, or use requestAnimationFrame
   *
   * @default requestAnimationFrame
   */
  interval?: "requestAnimationFrame" | number
}
/**
 * Reactive current Date instance.
 *
 * @see https://vueuse.org/useNow
 * @param options
 */
export declare function useNow(options?: UseNowOptions<false>): Ref<Date>
export declare function useNow(options: UseNowOptions<true>): {
  now: Ref<Date>
} & Pausable
export declare type UseNowReturn = ReturnType<typeof useNow>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useNow/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useNow/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useNow/index.md)


<!--FOOTER_ENDS-->
