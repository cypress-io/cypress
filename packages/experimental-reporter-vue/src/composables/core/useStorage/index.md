---
category: State
---

# useStorage

Reactive [LocalStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)/[SessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)

## Usage

```js
import { useStorage } from '@vueuse/core'

// bind object
const state = useStorage('my-store', { hello: 'hi', greeting: 'Hello' })

// bind boolean
const flag = useStorage('my-flag', true) // returns Ref<boolean>

// bind number
const count = useStorage('my-count', 0) // returns Ref<number>

// bind string with SessionStorage
const id = useStorage('my-id', 'some-string-id', sessionStorage) // returns Ref<string>

// delete data from storage
state.value = null
```


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export declare type Serializer<T> = {
  read(raw: string): T
  write(value: T): string
}
export declare type StorageLike = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>
export interface StorageOptions<T>
  extends ConfigurableEventFilter,
    ConfigurableWindow,
    ConfigurableFlush {
  /**
   * Watch for deep changes
   *
   * @default true
   */
  deep?: boolean
  /**
   * Listen to storage changes, useful for multiple tabs application
   *
   * @default true
   */
  listenToStorageChanges?: boolean
  /**
   * Custom data serialization
   */
  serializer?: Serializer<T>
}
export declare function useStorage(
  key: string,
  defaultValue: string,
  storage?: StorageLike,
  options?: StorageOptions<string>
): Ref<string>
export declare function useStorage(
  key: string,
  defaultValue: boolean,
  storage?: StorageLike,
  options?: StorageOptions<boolean>
): Ref<boolean>
export declare function useStorage(
  key: string,
  defaultValue: number,
  storage?: StorageLike,
  options?: StorageOptions<number>
): Ref<number>
export declare function useStorage<T>(
  key: string,
  defaultValue: T,
  storage?: StorageLike,
  options?: StorageOptions<T>
): Ref<T>
export declare function useStorage<T = unknown>(
  key: string,
  defaultValue: null,
  storage?: StorageLike,
  options?: StorageOptions<T>
): Ref<T>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useStorage/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useStorage/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useStorage/index.md)


<!--FOOTER_ENDS-->
