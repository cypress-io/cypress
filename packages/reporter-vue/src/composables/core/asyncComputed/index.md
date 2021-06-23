---
category: Utilities
---

# asyncComputed

Computed for async functions

## Usage

```js
import { ref } from 'vue'
import { asyncComputed } from '@vueuse/core'

const name = ref('jack')

const userInfo = asyncComputed(
  async() => {
    return await mockLookUp(name.value)
  },
  null, // initial state
)
```

### Evaluation State

You will need to pass a ref to track if the async function is evaluating,

```js
import { ref } from 'vue'
import { asyncComputed } from '@vueuse/core'

const evaluating = ref(false)

const userInfo = asyncComputed(
  async() => { /* your logic */ },
  null,
  evaluating,
)
```

### onCancel

When the computed source changed before the previous async function gets resolved, you may want to cancel the previous one. Here is an example showing how to incorporate with the fetch API.

```js
const packageName = ref('@vueuse/core')

const downloads = asyncComputed(async(onCancel) => {
  const abortController = new AbortController()

  onCancel(() => abortController.abort())

  return await fetch(
    `https://api.npmjs.org/downloads/point/last-week/${packageName.value}`,
    { signal: abortController.signal },
  )
    .then(response => response.ok ? response.json() : { downloads: '—' })
    .then(result => result.downloads)
}, 0)
```

### Lazy

By default, `asyncComputed` will start resolving immediately on creation, specify `lazy: true` to make it start resolving on the first accessing.

```js
import { ref } from 'vue'
import { asyncComputed } from '@vueuse/core'

const evaluating = ref(false)

const userInfo = asyncComputed(
  async() => { /* your logic */ },
  null,
  { lazy: true, evaluating },
)
```

## Caveats

- Just like Vue's built-in `computed` function, `useAsyncComputed` does dependency tracking and is automatically re-evaluated when dependencies change. Note however that only dependency referenced in the first call stack are considered for this. In other words: **Dependencies that are accessed asynchronously will not trigger re-evaluation of the async computed value.**

- As opposed to Vue's built-in `computed` function, re-evaluation of the async computed value is triggered whenever dependencies are changing, regardless of whether its result is currently being tracked or not.


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
/**
 * Handle overlapping async evaluations.
 *
 * @param cancelCallback The provided callback is invoked when a re-evaluation of the computed value is triggered before the previous one finished
 */
export declare type AsyncComputedOnCancel = (cancelCallback: Fn) => void
/**
 * Additional options for asyncComputed
 *
 * @property lazy         Should value be evaluated lazily
 * @property evaluating   Ref passed to receive the updated of async evaluation
 */
export declare type AsyncComputedOptions = {
  lazy?: Boolean
  evaluating?: Ref<boolean>
}
/**
 * Create an asynchronous computed dependency.
 *
 * @see https://vueuse.org/asyncComputed
 * @param evaluationCallback     The promise-returning callback which generates the computed value
 * @param initialState           The initial state, used until the first evaluation finishes
 * @param optionsOrRef           Additional options or a ref passed to receive the updates of the async evaluation
 */
export declare function asyncComputed<T>(
  evaluationCallback: (onCancel: AsyncComputedOnCancel) => T | Promise<T>,
  initialState?: T,
  optionsOrRef?: Ref<boolean> | AsyncComputedOptions
): Ref<T>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/asyncComputed/index.ts) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/asyncComputed/index.md)


<!--FOOTER_ENDS-->
