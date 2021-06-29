---
category: Utilities
---

# createEventHook

Utility for creating event hooks

## Usage


Creating a function that uses `createEventHook`
```ts
import { createEventHook } from '@vueuse/core'

export function useMyFetch(url) {
  const fetchResult = createEventHook<Response>()
  const fetchError = createEventHook<any>()

  fetch(url)
    .then(result => fetchResult.trigger(result))
    .catch(error => fetchError.trigger(error.message))

  return {
    onResult: fetchResult.on,
    onError: fetchError.on
  }
}
```

Using a function that uses `createEventHook`
```html
<script setup lang="ts">
import { useMyFetch } from './my-fetch-function'

const { onResult, onError } = useMyFetch('my api url')

onResult((result) => {
  console.log(result)
})

onError((error) => {
  console.errr(error)
})
</script>
```


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
/**
 * The source code for this function was inspired by vue-apollo's `useEventHook` util
 * https://github.com/vuejs/vue-apollo/blob/v4/packages/vue-apollo-composable/src/util/useEventHook.ts
 */
export declare type EventHookOn<T = any> = (fn: (param: T) => void) => {
  off: () => void
}
export declare type EventHookOff<T = any> = (fn: (param: T) => void) => void
export declare type EventHookTrigger<T = any> = (param: T) => void
export interface EventHook<T = any> {
  on: EventHookOn<T>
  off: EventHookOff<T>
  trigger: EventHookTrigger<T>
}
/**
 * Utility for creating event hooks
 *
 * @see https://vueuse.org/createEventHook
 */
export declare function createEventHook<T = any>(): EventHook<T>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/shared/createEventHook/index.ts) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/shared/createEventHook/index.md)


<!--FOOTER_ENDS-->
