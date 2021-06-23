---
category: Utilities
---

# reactify

Converts plain functions into reactive functions. The converted function accepts refs as its arguments and returns a ComputedRef, with proper typing.

::: tip
Interested to see some application or looking for some pre-reactified functions? 

Check out [⚗️ Vue Chemistry](https://github.com/antfu/vue-chemistry)!
:::

## Usage

Basic example

```ts
import { reactify } from '@vueuse/core'

// a plain function
function add(a: number, b: number): number {
  return a + b
}

// now it accept refs and returns a computed ref
// (a: number | Ref<number>, b: number | Ref<number>) => ComputedRef<number>
const reactiveAdd = reactify(add)

const a = ref(1)
const b = ref(2)
const sum = reactiveAdd(a, b)

console.log(sum.value) // 3

a.value = 5

console.log(sum.value) // 7
```

An example of implementing a reactive [Pythagorean theorem](https://en.wikipedia.org/wiki/Pythagorean_theorem).

```ts
import { reactify } from '@vueuse/core'

const pow = reactify(Math.pow)
const sqrt = reactify(Math.sqrt)
const add = reactify((a: number, b: number) => a + b)

const a = ref(3)
const b = ref(4)
const c = sqrt(add(pow(a, 2), pow(b, 2)))
console.log(c.value) // 5

// 5:12:13
a.value = 5
b.value = 12
console.log(c.value) // 13
```

You can also do it this way:

```ts
import { reactify } from '@vueuse/core'

function pythagorean(a: number, b: number) {
  return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2))
}

const a = ref(3)
const b = ref(4)

const c = reactify(pythagorean)(a, b)
console.log(c.value) // 5
```

Another example of making reactive `stringify`

```ts
import { reactify } from '@vueuse/core'

const stringify = reactify(JSON.stringify)

const obj = ref(42)
const dumped = stringify(obj)

console.log(dumped.value) // '42'

obj.value = { foo: "bar" }

console.log(dumped.value) // '{"foo":"bar"}'
```

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export declare type Reactify<T> = T extends (...args: infer A) => infer R
  ? (
      ...args: {
        [K in keyof A]: MaybeRef<A[K]>
      }
    ) => ComputedRef<R>
  : never
/**
 * Converts plain function into a reactive function.
 * The converted function accepts refs as it's arguments
 * and returns a ComputedRef, with proper typing.
 *
 * @param fn - Source function
 */
export declare function reactify<T extends Function>(fn: T): Reactify<T>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/shared/reactify/index.ts) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/shared/reactify/index.md)


<!--FOOTER_ENDS-->
