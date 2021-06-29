import { MaybeRef } from '../../shared'
import { computed, ComputedRef, reactive, readonly, Ref, ref } from 'vue'
import { useEventListener } from '../useEventListener'
import { SwipeDirection } from '../useSwipe/index'

export interface PointerSwipeOptions {
  /**
   * @default 50
   */
  threshold?: number

  /**
   * Callback on swipe start
   */
  onSwipeStart?: (e: PointerEvent) => void

  /**
   * Callback on swipe move
   */
  onSwipe?: (e: PointerEvent) => void

  /**
   * Callback on swipe end
   */
  onSwipeEnd?: (e: PointerEvent, direction: SwipeDirection) => void
}

export interface PointerPosition {
  x: number
  y: number
}

export interface PointerSwipeReturn {
  readonly isSwiping: Ref<boolean>
  direction: ComputedRef<SwipeDirection | null>
  readonly posStart: PointerPosition
  readonly posEnd: PointerPosition
  distanceX: ComputedRef<number>
  distanceY: ComputedRef<number>
  stop: () => void
}

/**
 * Reactive swipe detection based on PointerEvents.
 *
 * @see https://vueuse.org/usePointerSwipe
 * @param target
 * @param options
 */
export function usePointerSwipe(
  target: MaybeRef<Element | null | undefined>,
  options: PointerSwipeOptions = {},
): PointerSwipeReturn {
  const targetRef = ref(target)
  const {
    threshold = 50,
    onSwipe,
    onSwipeEnd,
    onSwipeStart,
  } = options

  const posStart = reactive<PointerPosition>({ x: 0, y: 0 })
  const updatePosStart = (x: number, y: number) => {
    posStart.x = x
    posStart.y = y
  }

  const posEnd = reactive({ x: 0, y: 0 })
  const updatePosEnd = (x: number, y: number) => {
    posEnd.x = x
    posEnd.y = y
  }

  const distanceX = computed(() => posStart.x - posEnd.x)
  const distanceY = computed(() => posStart.y - posEnd.y)

  const { max, abs } = Math
  const isThresholdExceeded = computed(() => max(abs(distanceX.value), abs(distanceY.value)) >= threshold)
  const isSwiping = ref(false)
  const isPointerDown = ref(false)

  const direction = computed(() => {
    if (!isThresholdExceeded.value)
      return SwipeDirection.NONE

    if (abs(distanceX.value) > abs(distanceY.value)) {
      return distanceX.value > 0
        ? SwipeDirection.LEFT
        : SwipeDirection.RIGHT
    }
    else {
      return distanceY.value > 0
        ? SwipeDirection.UP
        : SwipeDirection.DOWN
    }
  })

  const stops = [
    useEventListener(target, 'pointerdown', (e: PointerEvent) => {
      isPointerDown.value = true
      // Disable scroll on for TouchEvents
      targetRef.value && targetRef.value.setAttribute('style', 'touch-action: none')
      // Future pointer events will be retargeted to target until pointerup/cancel
      targetRef.value && targetRef.value.setPointerCapture(e.pointerId)

      const { clientX: x, clientY: y } = e
      updatePosStart(x, y)
      updatePosEnd(x, y)
      onSwipeStart && onSwipeStart(e)
    }),

    useEventListener(target, 'pointermove', (e: PointerEvent) => {
      if (!isPointerDown.value)
        return

      const { clientX: x, clientY: y } = e
      updatePosEnd(x, y)
      if (!isSwiping.value && isThresholdExceeded.value)
        isSwiping.value = true
      if (isSwiping.value)
        onSwipe && onSwipe(e)
    }),

    useEventListener(target, 'pointerup', (e: PointerEvent) => {
      if (isSwiping.value)
        onSwipeEnd && onSwipeEnd(e, direction.value)

      isPointerDown.value = false
      isSwiping.value = false
      targetRef.value && targetRef.value.setAttribute('style', 'touch-action: initial')
    }),
  ]

  const stop = () => stops.forEach(s => s())

  return {
    isSwiping: readonly(isSwiping),
    direction: readonly(direction),
    posStart: readonly(posStart),
    posEnd: readonly(posEnd),
    distanceX,
    distanceY,
    stop,
  }
}
