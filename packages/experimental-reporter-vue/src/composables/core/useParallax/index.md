---
category: Sensors
---

# useParallax

Create parallax effect easily. It uses `useDeviceOrientation` and fallback to `useMouse` if orientation is not supported.

## Usage

```html
<div ref='container'>
</div>
```

```js
import { useParallax } from '@vueuse/core'

export default {
  setup() {
    const container = ref(null)
    const { tilt, roll, source } = useParallax(container)

    return {
      container,
    }
  },
}
```


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface ParallaxOptions extends ConfigurableWindow {
  deviceOrientationTiltAdjust?: (i: number) => number
  deviceOrientationRollAdjust?: (i: number) => number
  mouseTiltAdjust?: (i: number) => number
  mouseRollAdjust?: (i: number) => number
}
export interface ParallaxReturn {
  /**
   * Roll value. Scaled to `-0.5 ~ 0.5`
   */
  roll: ComputedRef<number>
  /**
   * Tilt value. Scaled to `-0.5 ~ 0.5`
   */
  tilt: ComputedRef<number>
  /**
   * Sensor source, can be `mouse` or `deviceOrientation`
   */
  source: ComputedRef<"deviceOrientation" | "mouse">
}
/**
 * Create parallax effect easily. It uses `useDeviceOrientation` and fallback to `useMouse`
 * if orientation is not supported.
 *
 * @param target
 * @param options
 */
export declare function useParallax(
  target: MaybeElementRef,
  options?: ParallaxOptions
): ParallaxReturn
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useParallax/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useParallax/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useParallax/index.md)


<!--FOOTER_ENDS-->
