/* this implementation is original ported from https://github.com/logaretm/vue-use-web by Abdelrahman Awad */

import { MaybeRef, useTimeoutFn } from '../../shared'
import { ComputedRef, ref, unref } from 'vue'
import { useEventListener, WindowEventName } from '../useEventListener'
import { ConfigurableNavigator, defaultNavigator } from '../_configurable'

export interface ClipboardOptions<Source> extends ConfigurableNavigator {
  /**
   * Enabled reading for clipboard
   *
   * @default true
   */
  read?: boolean

  /**
   * Copy source
   */
  source?: Source

  /**
   * Milliseconds to reset state of `copied` ref
   *
   * @default 1500
   */
  copiedDuring?: number
}

export interface ClipboardReturn<Optional> {
  isSupported: boolean
  text: ComputedRef<string>
  copied: ComputedRef<boolean>
  copy: Optional extends true ? (text?: string) => Promise<void> : (text: string) => Promise<void>
}

/**
 * Reactive Clipboard API.
 *
 * @see https://vueuse.org/useClipboard
 * @param options
 */
export function useClipboard(options?: ClipboardOptions<undefined>): ClipboardReturn<false>
export function useClipboard(options: ClipboardOptions<MaybeRef<string>>): ClipboardReturn<true>
export function useClipboard(options: ClipboardOptions<MaybeRef<string> | undefined> = {}): ClipboardReturn<boolean> {
  const {
    navigator = defaultNavigator,
    read = true,
    source,
    copiedDuring = 1500,
  } = options

  const events = ['copy', 'cut']
  const isSupported = Boolean(navigator && 'clipboard' in navigator)
  const text = ref('')
  const copied = ref(false)

  const timeout = useTimeoutFn(() => copied.value = false, copiedDuring)

  function updateText() {
    // @ts-expect-error untyped API
    navigator.clipboard.readText().then((value) => {
      text.value = value
    })
  }

  if (isSupported && read) {
    for (const event of events)
      useEventListener(event as WindowEventName, updateText)
  }

  async function copy(value = unref(source)) {
    if (isSupported && value != null) {
      // @ts-expect-error untyped API
      await navigator.clipboard.writeText(value)
      text.value = value
      copied.value = true
      timeout.start()
    }
  }

  return {
    isSupported,
    text: text as ComputedRef<string>,
    copied: copied as ComputedRef<boolean>,
    copy,
  }
}
