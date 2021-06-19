import { ref } from 'vue'
import { MaybeElementRef } from '../unrefElement'
import { ResizeObserverOptions, useResizeObserver } from '../useResizeObserver'

/**
 * Reactive size of an HTML element.
 *
 * @see https://vueuse.org/useElementSize
 * @param target
 * @param callback
 * @param options
 */
export function useElementBounding(
  target: MaybeElementRef,
  options: ResizeObserverOptions = {},
) {
  const height = ref(0)
  const bottom = ref(0)
  const left = ref(0)
  const right = ref(0)
  const top = ref(0)
  const width = ref(0)
  const x = ref(0)
  const y = ref(0)

  useResizeObserver(
    target,
    ([entry]) => {
      height.value = entry.contentRect.height
      bottom.value = entry.contentRect.bottom
      left.value = entry.contentRect.left
      right.value = entry.contentRect.right
      top.value = entry.contentRect.top
      width.value = entry.contentRect.width
      x.value = entry.contentRect.x
      y.value = entry.contentRect.y
    },
    options,
  )

  return {
    x,
    y,
    top,
    right,
    bottom,
    left,
    width,
    height,
  }
}

export type UseElementBoundingReturn = ReturnType<typeof useElementBounding>
