---
category: Animation
---

# useTimestamp

Reactive current timestamp

## Usage

```js
import { useTimestamp } from '@vueuse/core'

const timestamp = useTimestamp({ offset: 0 })
```

```js
const { timestamp, pause, resume } = useTimestamp({ controls: true })
```

## Component

```html
<UseTimestamp v-slot="{ timestamp, pause, resume }">
  Current Time: {{ timestamp }}
  <button @click="pause()">Pause</button>
  <button @click="resume()">Resume</button>
</UseTimestamp>
```

<LearnMoreComponents />

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface TimestampOptions<Controls extends boolean> {
  /**
   * Expose more controls
   *
   * @default false
   */
  controls?: Controls
  /**
   * Offset value adding to the value
   *
   * @default 0
   */
  offset?: number
  /**
   * Update interval, or use requestAnimationFrame
   *
   * @default requestAnimationFrame
   */
  interval?: "requestAnimationFrame" | number
}
/**
 * Reactive current timestamp.
 *
 * @see https://vueuse.org/useTimestamp
 * @param options
 */
export declare function useTimestamp(
  options?: TimestampOptions<false>
): Ref<number>
export declare function useTimestamp(options: TimestampOptions<true>): {
  timestamp: Ref<number>
} & Pausable
export declare type UseTimestampReturn = ReturnType<typeof useTimestamp>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useTimestamp/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useTimestamp/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useTimestamp/index.md)


<!--FOOTER_ENDS-->
