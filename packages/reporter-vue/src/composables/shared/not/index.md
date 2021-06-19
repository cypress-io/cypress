---
category: Utilities
---

# not

`NOT` condition for ref.

## Usage

```ts
import { not } from '@vueuse/core'

const a = ref(true)

whenever(not(a), () => {
  console.log('a is now falsy!')
})
```

## Related Functions

- `and`
- `or`
- `whenever`

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
/**
 * `NOT` conditions for refs.
 *
 * @see https://vueuse.org/not
 */
export declare function not(v: MaybeRef<any>): ComputedRef<boolean>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/shared/not/index.ts) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/shared/not/index.md)


<!--FOOTER_ENDS-->
