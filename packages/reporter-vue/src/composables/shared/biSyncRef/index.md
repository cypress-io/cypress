---
category: Utilities
---

# biSyncRef

Two-way refs synchronization.

## Usage

```ts
import { biSyncRef } from '@vueuse/core'

const a = ref('a')
const b = ref('b')

const stop = biSyncRef(a, b)

console.log(a.value) // a

b.value = 'foo'

console.log(a.value) // foo

a.value = 'bar'

console.log(b.value) // bar
```

## Related Functions

- `syncRef`


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
/**
 * Two-way refs synchronization.
 *
 * @param a
 * @param b
 */
export declare function biSyncRef<R extends Ref<any>>(a: R, b: R): () => void
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/shared/biSyncRef/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/shared/biSyncRef/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/shared/biSyncRef/index.md)


<!--FOOTER_ENDS-->
