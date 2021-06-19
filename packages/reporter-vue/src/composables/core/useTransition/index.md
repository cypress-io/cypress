---
category: Animation
---

# useTransition

Transition between values

## Usage

For simple transitions, provide a numeric source value to watch. When changed, the output will transition to the new value. If the source changes while a transition is in progress, a new transition will begin from where the previous one was interrupted.

```js
import { ref } from 'vue'
import { useTransition, TransitionPresets } from '@vueuse/core'

const source = ref(0)

const output = useTransition(source, {
  duration: 1000,
  transition: TransitionPresets.easeInOutCubic,
})
```

To synchronize transitions, use an array of numbers. As an example, here is how we could transition between colors.

```js
const source = ref([0, 0, 0])

const output = useTransition(source)

const color = computed(() => {
  const [r, g, b] = output.value
  return `rgb(${r}, ${g}, ${b})`
})
```

Transition easing can be customized using cubic bezier curves. Transitions defined this way work the same as [CSS easing functions](https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function#easing_functions).

```js
useTransition(source, {
  transition: [0.75, 0, 0.25, 1],
})
```

The following transitions are available via the `TransitionPresets` constant.

- [`linear`](https://cubic-bezier.com/#0,0,1,1)
- [`easeInSine`](https://cubic-bezier.com/#.12,0,.39,0)
- [`easeOutSine`](https://cubic-bezier.com/#.61,1,.88,1)
- [`easeInOutSine`](https://cubic-bezier.com/#.37,0,.63,1)
- [`easeInQuad`](https://cubic-bezier.com/#.11,0,.5,0)
- [`easeOutQuad`](https://cubic-bezier.com/#.5,1,.89,1)
- [`easeInOutQuad`](https://cubic-bezier.com/#.45,0,.55,1)
- [`easeInCubic`](https://cubic-bezier.com/#.32,0,.67,0)
- [`easeOutCubic`](https://cubic-bezier.com/#.33,1,.68,1)
- [`easeInOutCubic`](https://cubic-bezier.com/#.65,0,.35,1)
- [`easeInQuart`](https://cubic-bezier.com/#.5,0,.75,0)
- [`easeOutQuart`](https://cubic-bezier.com/#.25,1,.5,1)
- [`easeInOutQuart`](https://cubic-bezier.com/#.76,0,.24,1)
- [`easeInQuint`](https://cubic-bezier.com/#.64,0,.78,0)
- [`easeOutQuint`](https://cubic-bezier.com/#.22,1,.36,1)
- [`easeInOutQuint`](https://cubic-bezier.com/#.83,0,.17,1)
- [`easeInExpo`](https://cubic-bezier.com/#.7,0,.84,0)
- [`easeOutExpo`](https://cubic-bezier.com/#.16,1,.3,1)
- [`easeInOutExpo`](https://cubic-bezier.com/#.87,0,.13,1)
- [`easeInCirc`](https://cubic-bezier.com/#.55,0,1,.45)
- [`easeOutCirc`](https://cubic-bezier.com/#0,.55,.45,1)
- [`easeInOutCirc`](https://cubic-bezier.com/#.85,0,.15,1)
- [`easeInBack`](https://cubic-bezier.com/#.36,0,.66,-.56)
- [`easeOutBack`](https://cubic-bezier.com/#.34,1.56,.64,1)
- [`easeInOutBack`](https://cubic-bezier.com/#.68,-.6,.32,1.6)

For more complex transitions, a custom function can be provided.

```js
const easeOutElastic = (n) => {
  return n === 0
    ? 0
    : n === 1
      ? 1
      : (2 ** (-10 * n)) * Math.sin((n * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1
}

useTransition(source, {
  transition: easeOutElastic,
})
```

To control when a transition starts, set a `delay` value. To choreograph behavior around a transition, define `onStarted` or `onFinished` callbacks.

```js
useTransition(source, {
  delay: 1000,
  onStarted() {
    // called after the transition starts
  },
  onFinished() {
    // called after the transition ends
  },
})
```

To temporarily stop transitioning, define a boolean `disabled` property. Be aware, this is not the same a `duration` of `0`. Disabled transitions track the source value **_synchronously_**. They do not respect a `delay`, and do not fire `onStarted` or `onFinished` callbacks.

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
/**
 * Cubic bezier points
 */
declare type CubicBezierPoints = [number, number, number, number]
/**
 * Easing function
 */
declare type EasingFunction = (n: number) => number
/**
 * Transition options
 */
export declare type TransitionOptions = {
  /**
   * Milliseconds to wait before starting transition
   */
  delay?: MaybeRef<number>
  /**
   * Disables the transition
   */
  disabled?: MaybeRef<boolean>
  /**
   * Transition duration in milliseconds
   */
  duration?: MaybeRef<number>
  /**
   * Callback to execute after transition finishes
   */
  onFinished?: () => void
  /**
   * Callback to execute after transition starts
   */
  onStarted?: () => void
  /**
   * Easing function or cubic bezier points for calculating transition values
   */
  transition?: MaybeRef<EasingFunction | CubicBezierPoints>
}
/**
 * Common transitions
 *
 * @see https://easings.net
 */
export declare const TransitionPresets: Record<
  string,
  CubicBezierPoints | EasingFunction
>
export declare function useTransition(
  source: Ref<number>,
  options?: TransitionOptions
): ComputedRef<number>
export declare function useTransition<T extends MaybeRef<number>[]>(
  source: [...T],
  options?: TransitionOptions
): ComputedRef<
  {
    [K in keyof T]: number
  }
>
export declare function useTransition<T extends Ref<number[]>>(
  source: T,
  options?: TransitionOptions
): ComputedRef<number[]>
export {}
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useTransition/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useTransition/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useTransition/index.md)


<!--FOOTER_ENDS-->
