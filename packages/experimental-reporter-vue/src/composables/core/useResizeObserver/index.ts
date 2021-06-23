import { tryOnUnmounted } from '../../shared'
import { watch } from 'vue'
import { MaybeElementRef, unrefElement } from '../unrefElement'
import { ConfigurableWindow, defaultWindow } from '../_configurable'

export interface ResizeObserverSize {
  readonly inlineSize: number
  readonly blockSize: number
}

export interface ResizeObserverEntry {
  readonly target: Element
  readonly contentRect: DOMRectReadOnly
  readonly borderBoxSize?: ReadonlyArray<ResizeObserverSize>
  readonly contentBoxSize?: ReadonlyArray<ResizeObserverSize>
  readonly devicePixelContentBoxSize?: ReadonlyArray<ResizeObserverSize>
}

// eslint-disable-next-line no-use-before-define
export type ResizeObserverCallback = (entries: ReadonlyArray<ResizeObserverEntry>, observer: ResizeObserver) => void

export interface ResizeObserverOptions extends ConfigurableWindow {
  /**
   * Sets which box model the observer will observe changes to. Possible values
   * are `content-box` (the default), and `border-box`.
   *
   * @default 'content-box'
   */
  box?: 'content-box' | 'border-box'
}

declare class ResizeObserver {
  constructor(callback: ResizeObserverCallback);
  disconnect(): void;
  observe(target: Element, options?: ResizeObserverOptions): void;
  unobserve(target: Element): void;
}

/**
 * Reports changes to the dimensions of an Element's content or the border-box
 *
 * @see https://vueuse.org/useResizeObserver
 * @param target
 * @param callback
 * @param options
 */
export function useResizeObserver(
  target: MaybeElementRef,
  callback: ResizeObserverCallback,
  options: ResizeObserverOptions = {},
) {
  debugger;
  const { window = defaultWindow, ...observerOptions } = options
  let observer: ResizeObserver | undefined
  const isSupported = window && 'ResizeObserver' in window

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
        observer = new window.ResizeObserver(callback)
        observer!.observe(el, observerOptions)
      }
    },
    { immediate: true, flush: 'post' },
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

export type UseResizeObserverReturn = ReturnType<typeof useResizeObserver>
