---
category: State
---

# useLocalStorage

Reactive [LocalStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage). 

## Usage

Please refer to `useStorage`


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export declare function useLocalStorage(
  key: string,
  defaultValue: string,
  options?: StorageOptions<string>
): Ref<string>
export declare function useLocalStorage(
  key: string,
  defaultValue: boolean,
  options?: StorageOptions<boolean>
): Ref<boolean>
export declare function useLocalStorage(
  key: string,
  defaultValue: number,
  options?: StorageOptions<number>
): Ref<number>
export declare function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  options?: StorageOptions<T>
): Ref<T>
export declare function useLocalStorage<T = unknown>(
  key: string,
  defaultValue: null,
  options?: StorageOptions<T>
): Ref<T>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useLocalStorage/index.ts) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useLocalStorage/index.md)


<!--FOOTER_ENDS-->
