---
category: Utilities
---

# makeDestructurable

Make isomorphic destructurable for object and array at the same time. See [this blog](https://antfu.me/posts/destructuring-with-object-or-array/) for more details.

## Usage

TypeScript Example:

```ts
import { makeDestructurable } from '@vueuse/core'

const foo = { name: 'foo' }
const bar: number = 1024

const obj = makeDestructurable(
  { foo, bar } as const,
  [ foo, bar ] as const
)
```

Usage:

```ts
let { foo, bar } = obj
let [ foo, bar ] = obj
```


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export declare function makeDestructurable<
  T extends Record<string, unknown>,
  A extends readonly any[]
>(obj: T, arr: A): T & A
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/shared/makeDestructurable/index.ts) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/shared/makeDestructurable/index.md)


<!--FOOTER_ENDS-->
