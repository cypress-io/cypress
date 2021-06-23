---
category: Browser
---

# usePermission

Reactive [Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API). The Permissions API provides the tools to allow developers to implement a better user experience as far as permissions are concerned.

## Usage

```js
import { usePermission } from '@vueuse/core'

const microphoneAccess = usePermission('microphone')
```


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
declare type DescriptorNamePolyfill = "clipboard-read" | "clipboard-write"
export declare type GeneralPermissionDescriptor =
  | PermissionDescriptor
  | DevicePermissionDescriptor
  | MidiPermissionDescriptor
  | PushPermissionDescriptor
  | {
      name: DescriptorNamePolyfill
    }
export interface UsePermissionOptions<Controls extends boolean>
  extends ConfigurableNavigator {
  /**
   * Expose more controls
   *
   * @default false
   */
  controls?: Controls
}
export declare type UsePermissionReturn = Readonly<
  Ref<PermissionState | undefined>
>
export interface UsePermissionReturnWithControls {
  state: UsePermissionReturn
  isSupported: boolean
  query: () => Promise<PermissionStatus | undefined>
}
/**
 * Reactive Permissions API.
 *
 * @see https://vueuse.org/usePermission
 */
export declare function usePermission(
  permissionDesc:
    | GeneralPermissionDescriptor
    | GeneralPermissionDescriptor["name"],
  options?: UsePermissionOptions<false>
): UsePermissionReturn
export declare function usePermission(
  permissionDesc:
    | GeneralPermissionDescriptor
    | GeneralPermissionDescriptor["name"],
  options: UsePermissionOptions<true>
): UsePermissionReturnWithControls
export {}
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/usePermission/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/usePermission/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/usePermission/index.md)


<!--FOOTER_ENDS-->
