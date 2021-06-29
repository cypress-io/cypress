import { computed, ComputedRef, ref, Ref, unref, watch } from 'vue'
import { clamp, identity as linear, isFunction, isNumber, MaybeRef, noop, useTimeoutFn } from '../../shared'
import { useRafFn } from '../useRafFn'

/**
 * Cubic bezier points
 */
type CubicBezierPoints = [number, number, number, number]

/**
 * Easing function
 */
type EasingFunction = (n: number) => number

/**
 * Transition options
 */
export type TransitionOptions = {
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
export const TransitionPresets: Record<string, CubicBezierPoints | EasingFunction> = {
  linear,
  easeInSine: [0.12, 0, 0.39, 0],
  easeOutSine: [0.61, 1, 0.88, 1],
  easeInOutSine: [0.37, 0, 0.63, 1],
  easeInQuad: [0.11, 0, 0.5, 0],
  easeOutQuad: [0.5, 1, 0.89, 1],
  easeInOutQuad: [0.45, 0, 0.55, 1],
  easeInCubic: [0.32, 0, 0.67, 0],
  easeOutCubic: [0.33, 1, 0.68, 1],
  easeInOutCubic: [0.65, 0, 0.35, 1],
  easeInQuart: [0.5, 0, 0.75, 0],
  easeOutQuart: [0.25, 1, 0.5, 1],
  easeInOutQuart: [0.76, 0, 0.24, 1],
  easeInQuint: [0.64, 0, 0.78, 0],
  easeOutQuint: [0.22, 1, 0.36, 1],
  easeInOutQuint: [0.83, 0, 0.17, 1],
  easeInExpo: [0.7, 0, 0.84, 0],
  easeOutExpo: [0.16, 1, 0.3, 1],
  easeInOutExpo: [0.87, 0, 0.13, 1],
  easeInCirc: [0.55, 0, 1, 0.45],
  easeOutCirc: [0, 0.55, 0.45, 1],
  easeInOutCirc: [0.85, 0, 0.15, 1],
  easeInBack: [0.36, 0, 0.66, -0.56],
  easeOutBack: [0.34, 1.56, 0.64, 1],
  easeInOutBack: [0.68, -0.6, 0.32, 1.6],
}

/**
 * Create an easing function from cubic bezier points.
 */
function createEasingFunction([p0, p1, p2, p3]: CubicBezierPoints): EasingFunction {
  const a = (a1: number, a2: number) => 1 - 3 * a2 + 3 * a1
  const b = (a1: number, a2: number) => 3 * a2 - 6 * a1
  const c = (a1: number) => 3 * a1

  const calcBezier = (t: number, a1: number, a2: number) => ((a(a1, a2) * t + b(a1, a2)) * t + c(a1)) * t

  const getSlope = (t: number, a1: number, a2: number) => 3 * a(a1, a2) * t * t + 2 * b(a1, a2) * t + c(a1)

  const getTforX = (x: number) => {
    let aGuessT = x

    for (let i = 0; i < 4; ++i) {
      const currentSlope = getSlope(aGuessT, p0, p2)
      if (currentSlope === 0)
        return aGuessT
      const currentX = calcBezier(aGuessT, p0, p2) - x
      aGuessT -= currentX / currentSlope
    }

    return aGuessT
  }

  return (x: number) => p0 === p1 && p2 === p3 ? x : calcBezier(getTforX(x), p1, p3)
}

// option 1: reactive number
export function useTransition(source: Ref<number>, options?: TransitionOptions): ComputedRef<number>

// option 2: static array of possibly reactive numbers
export function useTransition<T extends MaybeRef<number>[]>(source: [...T], options?: TransitionOptions): ComputedRef<{ [K in keyof T]: number }>

// option 3: reactive array of numbers
export function useTransition<T extends Ref<number[]>>(source: T, options?: TransitionOptions): ComputedRef<number[]>

/**
 * Transition between values.
 *
 * @see https://vueuse.org/useTransition
 * @param source
 * @param options
 */
export function useTransition(
  source: Ref<number | number[]> | MaybeRef<number>[],
  options: TransitionOptions = {},
): ComputedRef<any> {
  const {
    delay = 0,
    disabled = false,
    duration = 1000,
    onFinished = noop,
    onStarted = noop,
    transition = linear,
  } = options

  // current easing function
  const currentTransition = computed(() => {
    const t = unref(transition)
    return isFunction(t) ? t : createEasingFunction(t)
  })

  // raw source value
  const sourceValue = computed(() => {
    const s = unref(source)
    return isNumber(s) ? s : s.map(unref) as number[]
  })

  // normalized source vector
  const sourceVector = computed(() => isNumber(sourceValue.value) ? [sourceValue.value] : sourceValue.value)

  // transitioned output vector
  const outputVector = ref(sourceVector.value.slice(0))

  // current transition values
  let currentDuration: number
  let diffVector: number[]
  let endAt: number
  let startAt: number
  let startVector: number[]

  // transition loop
  const { resume, pause } = useRafFn(() => {
    const now = Date.now()
    const progress = clamp(1 - ((endAt - now) / currentDuration), 0, 1)

    outputVector.value = startVector.map((val, i) => {
      let vec: any = 0
      if (diffVector[i]) {
        vec = diffVector[i]
      }
      return val + ((vec) * currentTransition.value(progress))
    })
    
    if (progress >= 1) {
      pause()
      onFinished()
    }
  }, { immediate: false })

  // start the animation loop when source vector changes
  const start = () => {
    pause()

    currentDuration = unref(duration)
    diffVector = outputVector.value.map((n, i) => {
      let sourceV: any = 0
      let outputV: any = 0
      if (sourceVector.value[i]) {
        sourceV = sourceVector.value[i]
      }
      if (outputV.value[i]) {
        outputV = outputVector.value[i]
      }
      return sourceV - outputV
    })
    startVector = outputVector.value.slice(0)
    startAt = Date.now()
    endAt = startAt + currentDuration

    resume()
    onStarted()
  }

  const timeout = useTimeoutFn(start, delay, { immediate: false })

  watch(sourceVector, () => {
    if (unref(disabled)) {
      outputVector.value = sourceVector.value.slice(0)
    }
    else {
      if (unref(delay) <= 0) start()
      else timeout.start()
    }
  }, { deep: true })

  return computed(() => {
    const targetVector = unref(disabled) ? sourceVector : outputVector
    return isNumber(sourceValue.value) ? targetVector.value[0] : targetVector.value
  })
}
