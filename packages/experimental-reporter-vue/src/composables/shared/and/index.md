---
category: Utilities
---

# and

`AND` condition for refs.

## Usage

```ts
import { and } from '@vueuse/core'

const a = ref(true)
const b = ref(false)

whenever(and(a, b), () => {
  console.log('both a and b are now truthy!')
})
```

## Related Functions

- `or`
- `not`
- `whenever`

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
/**
 * `AND` conditions for refs.
 *
 * @see https://vueuse.org/and
 */
export declare function and(...args: MaybeRef<any>[]): ComputedRef<boolean>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/shared/and/index.ts) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/shared/and/index.md)


<!--FOOTER_ENDS-->
