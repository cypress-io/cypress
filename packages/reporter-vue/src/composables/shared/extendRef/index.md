---
category: Utilities
---

# extendRef

Add extra attributes to Ref.

## Usage

> This function is **NOT compatible with Vue 2**.

> Please note the extra attribute will not be accessible in Vue's template.

```ts
import { ref } from 'vue'
import { extendRef } from '@vueuse/core'

const myRef = ref('content')

const extended = extendRef(myRef, { foo: 'extra data' })

extended.value === 'content'
extended.foo === 'extra data'
```

Refs will be unwrapped and be reactive

```ts
const myRef = ref('content')
const extraRef = ref('extra')

const extended = extendRef(myRef, { extra: extraRef })

extended.value === 'content'
extended.extra === 'extra'

extended.extra = 'new data' // will trigger update
extraRef.value === 'new data'
```


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface ExtendRefOptions<Unwrap extends boolean = boolean> {
  /**
   * Is the extends properties enumerable
   *
   * @default false
   */
  enumerable?: boolean
  /**
   * Unwrap for Ref properties
   *
   * @default true
   */
  unwrap?: Unwrap
}
/**
 * Overlad 1: Unwrap set to false
 */
export declare function extendRef<
  R extends Ref<any>,
  Extend extends object,
  Options extends ExtendRefOptions<false>
>(ref: R, extend: Extend, options?: Options): ShallowUnwrapRef<Extend> & R
/**
 * Overlad 2: Unwrap unset or set to true
 */
export declare function extendRef<
  R extends Ref<any>,
  Extend extends object,
  Options extends ExtendRefOptions
>(ref: R, extend: Extend, options?: Options): Extend & R
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/shared/extendRef/index.ts) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/shared/extendRef/index.md)


<!--FOOTER_ENDS-->
