---
category: Browser
---

# useShare

Reactive [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share). The Browser provides features that can share content in text or file.

> The `share` method has to be called following a user gesture like a button click. It can’t simply be called on page load for example. That’s in place to help prevent abuse.

## Usage

```js
import { useShare } from '@vueuse/core'

const { share, isSupported } = useShare()

function startShare() {
  share({
    title: 'Hello',
    text: 'Hello my friend!',
    url: location.href,
  })
}
```


### Passing a source ref

You can pass a `ref` to it, changes from the source ref will be reflected to your sharing options.

```js {7}
import { ref } from 'vue'

const shareOptions = ref<ShareOptions>({ text: 'foo' })
const { share, isSupported } = useShare(shareOptions)

shareOptions.value.text = 'bar'

share()
```



<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface ShareOptions {
  title?: string
  files?: File[]
  text?: string
  url?: string
}
/**
 * Reactive Web Share API.
 *
 * @see https://vueuse.org/useShare
 * @param shareOptions
 * @param options
 */
export declare function useShare(
  shareOptions?: MaybeRef<ShareOptions>,
  options?: ConfigurableNavigator
): {
  isSupported: boolean
  share: (overrideOptions?: MaybeRef<ShareOptions>) => Promise<void>
}
export declare type UseShareReturn = ReturnType<typeof useShare>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useShare/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useShare/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useShare/index.md)


<!--FOOTER_ENDS-->
