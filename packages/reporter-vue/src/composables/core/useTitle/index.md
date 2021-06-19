---
category: Browser
---

# useTitle

Reactive document title.

## Usage

```js
import { useTitle } from '@vueuse/core'

const title = useTitle()
console.log(title.value) // print current title
title.value = 'Hello' // change current title
```

Set initial title immediately

```js
const title = useTitle('New Title')
```

Pass a `ref` and the title will be updated when the source ref changes

```js
import { useTitle } from '@vueuse/core'

const messages = ref(0)

const title = computed(() => {
  return !messages.value ? 'No message' : `${messages.value} new messages`
})

useTitle(title) // document title will match with the ref "title"
```


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface UseTitleOptions extends ConfigurableDocument {
  /**
   * Observe `document.title` changes using MutationObserve
   *
   * @default false
   */
  observe?: boolean
}
/**
 * Reactive document title.
 *
 * @see https://vueuse.org/useTitle
 * @param newTitle
 * @param options
 */
export declare function useTitle(
  newTitle?: MaybeRef<string | null | undefined>,
  options?: UseTitleOptions
): Ref<string | null | undefined>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useTitle/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useTitle/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useTitle/index.md)


<!--FOOTER_ENDS-->
