import { ref } from 'vue'
import { MaybeElementRef } from '../unrefElement'
import { ResizeObserverOptions, useResizeObserver } from '../useResizeObserver'

export interface ElementSize {
  width: number
  height: number
}

/**
 * Reactive size of an HTML element.
 *
 * @see https://vueuse.org/useElementSize
 * @param target
 * @param callback
 * @param options
 */
export function useElementSize(
  target: MaybeElementRef,
  initialSize: ElementSize = { width: 0, height: 0 },
  options: ResizeObserverOptions = {},
) {
  const width = ref(initialSize.width)
  const height = ref(initialSize.height)

  useResizeObserver(
    target,
    ([entry]) => {

      debugger;
      width.value = entry.contentRect.width
      height.value = entry.contentRect.height
    },
    options,
  )

  return {
    width,
    height,
  }
}

export type UseElementSizeReturn = ReturnType<typeof useElementSize>
