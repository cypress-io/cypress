---
category: Utilities
---

# reactifyObject

Apply `reactify` to an object

## Usage

```ts
import { reactifyObject } from '@vueuse/core'

const console = reactifyObject(console)

const a = ref('42')

console.log(a) // no longer need `.value`
```

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export declare type ReactifyNested<T, Keys extends keyof T = keyof T> = {
  [K in Keys]: T[K] extends (...args: any[]) => any ? Reactify<T[K]> : T[K]
}
export interface ReactifyObjectOptions {
  /**
   * Includes names from Object.getOwnPropertyNames
   *
   * @default true
   */
  includeOwnProperties?: boolean
}
/**
 * Apply `reactify` to an object
 */
export declare function reactifyObject<T extends object, Keys extends keyof T>(
  obj: T,
  keys?: (keyof T)[]
): ReactifyNested<T, Keys>
export declare function reactifyObject<T extends object>(
  obj: T,
  options?: ReactifyObjectOptions
): ReactifyNested<T>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/shared/reactifyObject/index.ts) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/shared/reactifyObject/index.md)


<!--FOOTER_ENDS-->
