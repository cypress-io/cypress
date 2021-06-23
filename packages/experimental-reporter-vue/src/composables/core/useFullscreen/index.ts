/* this implementation is original ported from https://github.com/logaretm/vue-use-web by Abdelrahman Awad */

import { ref } from 'vue'
import { MaybeElementRef } from '../unrefElement'
import { useEventListener } from '../useEventListener'
import { ConfigurableDocument, defaultDocument } from '../_configurable'

type FunctionMap = [
  'requestFullscreen',
  'exitFullscreen',
  'fullscreenElement',
  'fullscreenEnabled',
  'fullscreenchange',
  'fullscreenerror',
]

// from: https://github.com/sindresorhus/screenfull.js/blob/master/src/screenfull.js
const functionsMap: FunctionMap[] = [
  [
    'requestFullscreen',
    'exitFullscreen',
    'fullscreenElement',
    'fullscreenEnabled',
    'fullscreenchange',
    'fullscreenerror',
  ],
  // New WebKit
  [
    'webkitRequestFullscreen',
    'webkitExitFullscreen',
    'webkitFullscreenElement',
    'webkitFullscreenEnabled',
    'webkitfullscreenchange',
    'webkitfullscreenerror',
  ],
  // Old WebKit
  [
    'webkitRequestFullScreen',
    'webkitCancelFullScreen',
    'webkitCurrentFullScreenElement',
    'webkitCancelFullScreen',
    'webkitfullscreenchange',
    'webkitfullscreenerror',
  ],
  [
    'mozRequestFullScreen',
    'mozCancelFullScreen',
    'mozFullScreenElement',
    'mozFullScreenEnabled',
    'mozfullscreenchange',
    'mozfullscreenerror',
  ],
  [
    'msRequestFullscreen',
    'msExitFullscreen',
    'msFullscreenElement',
    'msFullscreenEnabled',
    'MSFullscreenChange',
    'MSFullscreenError',
  ],
] as any

/**
 * Reactive Fullscreen API.
 *
 * @see https://vueuse.org/useFullscreen
 * @param target
 * @param options
 */
export function useFullscreen(
  target?: MaybeElementRef,
  options: ConfigurableDocument = {},
) {
  const { document = defaultDocument } = options
  const targetRef = ref(target || document && document.querySelector('html'))
  const isFullscreen = ref(false)
  let isSupported = false

  let map: FunctionMap = functionsMap[0]

  if (!document) {
    isSupported = false
  }
  else {
    for (const m of functionsMap) {
      if (m[1] in document) {
        map = m
        isSupported = true
        break
      }
    }
  }

  const [REQUEST, EXIT, ELEMENT,, EVENT] = map

  async function exit() {
    if (!isSupported)
      return
    if (document && document && document[ELEMENT])
      await document[EXIT]()

    isFullscreen.value = false
  }

  async function enter() {
    if (!isSupported)
      return

    await exit()

    if (targetRef.value) {
      await targetRef.value[REQUEST]()
      isFullscreen.value = true
    }
  }

  async function toggle() {
    if (isFullscreen.value)
      await exit()
    else
      await enter()
  }

  if (document) {
    useEventListener(document, EVENT, () => {
      isFullscreen.value = !!document && document[ELEMENT]
    }, false)
  }

  return {
    isSupported,
    isFullscreen,
    enter,
    exit,
    toggle,
  }
}

export type UseFullscreenReturn = ReturnType<typeof useFullscreen>
