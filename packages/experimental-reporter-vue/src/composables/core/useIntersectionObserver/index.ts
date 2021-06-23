import { watch } from 'vue'
import { noop, tryOnUnmounted } from '../../shared'
import { ConfigurableWindow, defaultWindow } from '../_configurable'
import { MaybeElementRef, unrefElement } from '../unrefElement'

export interface IntersectionObserverOptions extends ConfigurableWindow {
  /**
   * The Element or Document whose bounds are used as the bounding box when testing for intersection.
   */
  root?: MaybeElementRef

  /**
   * A string which specifies a set of offsets to add to the root's bounding_box when calculating intersections.
   */
  rootMargin?: string

  /**
   * Either a single number or an array of numbers between 0.0 and 1.
   */
  threshold?: number | number[]
}

/**
 * Detects that a target element's visibility.
 *
 * @see https://vueuse.org/useIntersectionObserver
 * @param target
 * @param callback
 * @param options
 */
export function useIntersectionObserver(
  target: MaybeElementRef,
  callback: IntersectionObserverCallback,
  options: IntersectionObserverOptions = {},
) {
  const {
    root,
    rootMargin = '0px',
    threshold = 0.1,
    window = defaultWindow,
  } = options

  const isSupported = window && 'IntersectionObserver' in window

  let cleanup = noop

  const stopWatch = isSupported
    ? watch(
      () => ({
        el: unrefElement(target),
        root: unrefElement(root),
      }),
      ({ el, root }) => {
        cleanup()

        if (!el)
          return

        // @ts-expect-error missing type
        const observer = new window.IntersectionObserver(
          callback,
          {
            root,
            rootMargin,
            threshold,
          },
        )
        observer.observe(el)

        cleanup = () => {
          observer.disconnect()
          cleanup = noop
        }
      },
      { immediate: true, flush: 'post' },
    )
    : noop

  const stop = () => {
    cleanup()
    stopWatch()
  }

  tryOnUnmounted(stop)

  return {
    isSupported,
    stop,
  }
}

export type UseIntersectionObserverReturn = ReturnType<typeof useIntersectionObserver>
