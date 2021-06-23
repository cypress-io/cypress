---
category: Watch
---

# whenever

Shorthand for watching value to be truthy.

## Usage

```js
import { whenever, useAsyncState } from '@vueuse/core'

const { state, ready } = useAsyncState(
  fetch('https://jsonplaceholder.typicode.com/todos/1').then(t => t.json()),
  {},
)

whenever(ready, () => console.log(state))
```

```ts
// this
whenever(ready, () => console.log(state))

// is equivalent to:
watch(ready, (isReady) => {
  if (isReady) {
    console.log(state)
  }
})
```

### Computed

Same as `watch`, you can pass a getter function to calculate on each change.

```ts
// this
whenever(
  () => counter.value === 7, 
  () => console.log('counter is 7 now!'),
)
```

### Options

Options and defaults are same with `watch`.

```ts
// this
whenever(
  () => counter.value === 7, 
  () => console.log('counter is 7 now!'),
  { flush: 'sync' }
)
```

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
/**
 * Shorthand for watching value to be truthy
 *
 * @see https://vueuse.js.org/whenever
 */
export declare function whenever<T = boolean>(
  source: WatchSource<T>,
  cb: Fn,
  options?: WatchOptions
): WatchStopHandle
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/shared/whenever/index.ts) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/shared/whenever/index.md)


<!--FOOTER_ENDS-->
