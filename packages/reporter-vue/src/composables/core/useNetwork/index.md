---
category: Sensors
---

# useNetwork

Reactive [Network status](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API). The Network Information API provides information about the system's connection in terms of general connection type (e.g., 'wifi', 'cellular', etc.). This can be used to select high definition content or low definition content based on the user's connection. The entire API consists of the addition of the NetworkInformation interface and a single property to the Navigator interface: Navigator.connection.

## Usage

```js
import { useNetwork } from '@vueuse/core'

const { isOnline, offlineAt, downlink, downlinkMax, effectiveType, saveData, type } = useNetwork()

console.log(isOnline.value)
```

To use as an object, wrapper it with `reactive()`

```js
import { reactive } from 'vue'

const network = reactive(useNetwork())

console.log(network.isOnline)
```

## Component

```html
<UseNetwork v-slot="{ isOnline, type }">
  Is Online: {{ isOnline }}
  Type: {{ type }}
<UseNetwork>
```

<LearnMoreComponents />

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export declare type NetworkType =
  | "bluetooth"
  | "cellular"
  | "ethernet"
  | "none"
  | "wifi"
  | "wimax"
  | "other"
  | "unknown"
export declare type NetworkEffectiveType =
  | "slow-2g"
  | "2g"
  | "3g"
  | "4g"
  | undefined
export interface NetworkState {
  isSupported: boolean
  /**
   * If the user is currently connected.
   */
  isOnline: Ref<boolean>
  /**
   * The time since the user was last connected.
   */
  offlineAt: Ref<number | undefined>
  /**
   * The download speed in Mbps.
   */
  downlink: Ref<number | undefined>
  /**
   * The max reachable download speed in Mbps.
   */
  downlinkMax: Ref<number | undefined>
  /**
   * The detected effective speed type.
   */
  effectiveType: Ref<NetworkEffectiveType | undefined>
  /**
   * If the user activated data saver mode.
   */
  saveData: Ref<boolean | undefined>
  /**
   * The detected connection/network type.
   */
  type: Ref<NetworkType>
}
/**
 * Reactive Network status.
 *
 * @see https://vueuse.org/useNetwork
 * @param options
 */
export declare function useNetwork(options?: ConfigurableWindow): NetworkState
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useNetwork/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useNetwork/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useNetwork/index.md)


<!--FOOTER_ENDS-->
