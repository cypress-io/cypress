---
category: State
---

# useSessionStorage

Reactive [SessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage). 

## Usage

Please refer to `useStorage`

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export declare function useSessionStorage(
  key: string,
  defaultValue: string,
  options?: StorageOptions<string>
): Ref<string>
export declare function useSessionStorage(
  key: string,
  defaultValue: boolean,
  options?: StorageOptions<boolean>
): Ref<boolean>
export declare function useSessionStorage(
  key: string,
  defaultValue: number,
  options?: StorageOptions<number>
): Ref<number>
export declare function useSessionStorage<T>(
  key: string,
  defaultValue: T,
  options?: StorageOptions<T>
): Ref<T>
export declare function useSessionStorage<T = unknown>(
  key: string,
  defaultValue: null,
  options?: StorageOptions<T>
): Ref<T>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useSessionStorage/index.ts) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useSessionStorage/index.md)


<!--FOOTER_ENDS-->
