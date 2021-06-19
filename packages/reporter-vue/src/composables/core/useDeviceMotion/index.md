---
category: Sensors
---

# useDeviceMotion

Reactive [DeviceMotionEvent](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent). Provide web developers with information about the speed of changes for the device's position and orientation.

## Usage

```js
import { useDeviceMotion } from '@vueuse/core'

const {
  acceleration,
  accelerationIncludingGravity,
  rotationRate,
  interval,
} = useDeviceMotion()
```

| State                        | Type     | Description                                                                                                          |
| ---------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| acceleration                 | `object` | An object giving the acceleration of the device on the three axis X, Y and Z.                                        |
| accelerationIncludingGravity | `object` | An object giving the acceleration of the device on the three axis X, Y and Z with the effect of gravity.             |
| rotationRate                 | `object` | An object giving the rate of change of the device's orientation on the three orientation axis alpha, beta and gamma. |
| interval                     | `Number` | A number representing the interval of time, in milliseconds, at which data is obtained from the device..             |

You can find [more information about the state on the MDN](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent#Properties).


## Component

```html
<UseDeviceMotion v-slot="{ acceleration }">
  Acceleration: {{ acceleration }}
</UseDeviceMotion>
```

<LearnMoreComponents />


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface DeviceMotionOptions
  extends ConfigurableWindow,
    ConfigurableEventFilter {}
/**
 * Reactive DeviceMotionEvent.
 *
 * @see https://vueuse.org/useDeviceMotion
 * @param options
 */
export declare function useDeviceMotion(options?: DeviceMotionOptions): {
  acceleration: Ref<DeviceMotionEventAcceleration | null>
  accelerationIncludingGravity: Ref<DeviceMotionEventAcceleration | null>
  rotationRate: Ref<DeviceMotionEventRotationRate | null>
  interval: Ref<number>
}
export declare type UseDeviceMotionReturn = ReturnType<typeof useDeviceMotion>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useDeviceMotion/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useDeviceMotion/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useDeviceMotion/index.md)


<!--FOOTER_ENDS-->
