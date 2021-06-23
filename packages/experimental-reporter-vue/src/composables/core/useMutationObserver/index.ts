import { tryOnUnmounted } from '../../shared'
import { watch } from 'vue'
import { MaybeElementRef, unrefElement } from '../unrefElement'
import { ConfigurableWindow, defaultWindow } from '../_configurable'

export interface MutationObserverOptions extends MutationObserverInit, ConfigurableWindow {}

/**
 * Watch for changes being made to the DOM tree.
 *
 * @see https://vueuse.org/useMutationObserver
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver MutationObserver MDN
 * @param target
 * @param callback
 * @param options
 */
export function useMutationObserver(
  target: MaybeElementRef,
  callback: MutationCallback,
  options: MutationObserverOptions = {},
) {
  const { window = defaultWindow, ...mutationOptions } = options
  let observer: MutationObserver | undefined
  const isSupported = window && 'IntersectionObserver' in window

  const cleanup = () => {
    if (observer) {
      observer.disconnect()
      observer = undefined
    }
  }

  const stopWatch = watch(
    () => unrefElement(target),
    (el) => {
      cleanup()

      if (isSupported && window && el) {
        // @ts-expect-error missing type
        observer = new window.MutationObserver(callback)
        observer!.observe(el, mutationOptions)
      }
    },
    { immediate: true },
  )

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

export type UseMutationObserverReturn = ReturnType<typeof useMutationObserver>
