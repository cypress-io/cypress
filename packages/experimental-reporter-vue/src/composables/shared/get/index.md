---
category: Utilities
---

# get

Shorthand for accessing `ref.value`

## Usage

```ts
import { get } from '@vueuse/core'

const a = ref(42)

console.log(get(a)) // 42
```

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
/**
 * Shorthand for accessing `ref.value`
 */
export declare function get<T>(ref: MaybeRef<T>): T
export declare function get<T, K extends keyof T>(
  ref: MaybeRef<T>,
  key: K
): T[K]
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/shared/get/index.ts) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/shared/get/index.md)


<!--FOOTER_ENDS-->
