---
category: Sensors
---

# useDevicesList

Reactive [enumerateDevices](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices) listing avaliable input/output devices.

## Usage

```js
import { useDevicesList } from '@vueuse/core'

const {
  devices,
  videoInputs: cameras,
  audioInputs: microphones,
  audioOutputs: speakers,
} = useDevicesList()
```

# Component
```html
<UseDevicesList v-slot="{ videoInputs, audioInputs, audioOutputs }">
  Cameras: {{ videoInputs }}
  Microphones: {{ audioInputs }}
  Speakers: {{ audioOutputs }}
</UseDevicesList>
```

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface UseDevicesListOptions extends ConfigurableNavigator {
  onUpdated?: (devices: MediaDeviceInfo[]) => void
  /**
   * Request for permissions immediately if it's not granted,
   * otherwise label and deviceIds could be empty
   *
   * @default false
   */
  requestPermissions?: boolean
}
export interface UseDevicesListReturn {
  /**
   * All devices
   */
  devices: Ref<MediaDeviceInfo[]>
  videoInputs: ComputedRef<MediaDeviceInfo[]>
  audioInputs: ComputedRef<MediaDeviceInfo[]>
  audioOutputs: ComputedRef<MediaDeviceInfo[]>
  permissionGranted: Ref<boolean>
  ensurePermissions: () => Promise<boolean>
  isSupported: boolean
}
/**
 * Reactive `enumerateDevices` listing avaliable input/output devices
 *
 * @see https://vueuse.org/useDevicesList
 * @param options
 */
export declare function useDevicesList(
  options?: UseDevicesListOptions
): UseDevicesListReturn
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useDevicesList/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useDevicesList/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useDevicesList/index.md)


<!--FOOTER_ENDS-->
