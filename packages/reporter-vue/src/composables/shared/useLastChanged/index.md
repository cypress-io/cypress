---
category: Utilities
---

# useLastChanged

Records the timestamp of the last change

## Usage

```ts
import { useLastChanged } from '@vueuse/core'

const a = ref(0)

const lastChanged = useLastChanged(a)

a.value = 1

console.log(lastChanged.value)
```

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface UseLastChangedOptions<
  Immediate extends boolean,
  InitialValue extends number | null | undefined = undefined
> extends WatchOptions<Immediate> {
  initialValue?: InitialValue
}
/**
 * Records the timestamp of the last change
 *
 * @see https://vueuse.org/useLastChanged
 */
export declare function useLastChanged(
  source: WatchSource,
  options?: UseLastChangedOptions<false>
): Ref<number | null>
export declare function useLastChanged(
  source: WatchSource,
  options: UseLastChangedOptions<true>
): Ref<number>
export declare function useLastChanged(
  source: WatchSource,
  options: UseLastChangedOptions<boolean, number>
): Ref<number>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/shared/useLastChanged/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/shared/useLastChanged/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/shared/useLastChanged/index.md)


<!--FOOTER_ENDS-->
