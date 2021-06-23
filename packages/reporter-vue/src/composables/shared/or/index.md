---
category: Utilities
---

# or

`OR` conditions for refs.

## Usage

```ts
import { or } from '@vueuse/core'

const a = ref(true)
const b = ref(false)

whenever(or(a, b), () => {
  console.log('either a or b is truthy!')
})
```

## Related Functions

- `and`
- `not`
- `whenever`

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
/**
 * `OR` conditions for refs.
 *
 * @see https://vueuse.org/or
 */
export declare function or(...args: MaybeRef<any>[]): ComputedRef<boolean>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/shared/or/index.ts) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/shared/or/index.md)


<!--FOOTER_ENDS-->
