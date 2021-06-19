---
category: Formatters
---

# useTimeAgo

Reactive time ago.

## Usage

```js
import { useTimeAgo } from '@vueuse/core'

const timeAgo = useTimeAgo(new Date(2021, 0, 1))
```

## Component

```html
<UseTimeAgo v-slot="{ timeAgo }" :time="new Date(2021, 0, 1)">
  Time Ago: {{ timeAgo }}
</UseTimeAgo>
```

<LearnMoreComponents />

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export declare type MessageFormatter<T = number> = (
  value: T,
  isPast: boolean
) => string
export interface TimeAgoMessages {
  justNow: string
  past: string | MessageFormatter<string>
  future: string | MessageFormatter<string>
  year: string | MessageFormatter<number>
  month: string | MessageFormatter<number>
  day: string | MessageFormatter<number>
  week: string | MessageFormatter<number>
  hour: string | MessageFormatter<number>
  minute: string | MessageFormatter<number>
  second: string | MessageFormatter<number>
}
export interface TimeAgoOptions<Controls extends boolean> {
  /**
   * Expose more controls
   *
   * @default false
   */
  controls?: Controls
  /**
   * Intervals to update, set 0 to disable auto update
   *
   * @default 30_000
   */
  updateInterval?: number
  /**
   * Maximum unit (of diff in milliseconds) to display the full date instead of relative
   *
   * @default undefined
   */
  max?:
    | "second"
    | "minute"
    | "hour"
    | "day"
    | "week"
    | "month"
    | "year"
    | number
  /**
   * Formatter for full date
   */
  fullDateFormatter?: (date: Date) => string
  /**
   * Messages for formating the string
   */
  messages?: TimeAgoMessages
}
/**
 * Reactive time ago formatter.
 *
 * @see https://vueuse.org/useTimeAgo
 * @param options
 */
export declare function useTimeAgo(
  time: MaybeRef<Date | number | string>,
  options?: TimeAgoOptions<false>
): ComputedRef<string>
export declare function useTimeAgo(
  time: MaybeRef<Date | number | string>,
  options: TimeAgoOptions<true>
): {
  timeAgo: ComputedRef<string>
} & Pausable
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useTimeAgo/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useTimeAgo/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useTimeAgo/index.md)


<!--FOOTER_ENDS-->
