// ported from https://www.reddit.com/r/vuejs/comments/jksizl/speech_recognition_as_a_vue_3_hook
// by https://github.com/wobsoriano

import { tryOnUnmounted } from '../../shared'
import { Ref, ref, watch, shallowRef } from 'vue'
import { ConfigurableWindow, defaultWindow } from '../_configurable'

export interface SpeechRecognitionOptions extends ConfigurableWindow {
  /**
   * Controls whether continuous results are returned for each recognition, or only a single result.
   *
   * @default true
   */
  continuous?: boolean
  /**
   * Controls whether interim results should be returned (true) or not (false.) Interim results are results that are not yet final
   *
   * @default true
   */
  interimResults?: boolean
  /**
   * Langauge for SpeechRecognition
   *
   * @default 'en-US'
   */
  lang?: string
}

/**
 * Reactive SpeechRecognition.
 *
 * @see https://vueuse.org/useSpeechRecognition
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition SpeechRecognition
 * @param options
 */
export function useSpeechRecognition(options: SpeechRecognitionOptions = {}) {
  const {
    lang = 'en-US',
    interimResults = true,
    continuous = true,
    window = defaultWindow,
  } = options

  const isListening = ref(false)
  const isFinal = ref(false)
  const result = ref('')
  const error = shallowRef(undefined) as Ref<SpeechRecognitionErrorEvent | undefined>

  const toggle = (value = !isListening.value) => {
    isListening.value = value
  }

  const start = () => {
    isListening.value = true
  }

  const stop = () => {
    isListening.value = false
  }

  const SpeechRecognition = window && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  const isSupported = Boolean(SpeechRecognition)

  let recognition: SpeechRecognition | undefined

  if (isSupported) {
    recognition = new SpeechRecognition() as SpeechRecognition

    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognition.lang = lang

    recognition.onstart = () => {
      isFinal.value = false
    }

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => {
          isFinal.value = result.isFinal
          return result[0]
        })
        .map(result => result.transcript)
        .join('')

      result.value = transcript
      error.value = undefined
    }

    recognition.onerror = (event) => {
      error.value = event
    }

    recognition.onend = () => {
      isListening.value = false
    }

    watch(isListening, () => {
      if (isListening.value)
        recognition!.start()
      else
        recognition!.stop()
    })
  }

  tryOnUnmounted(() => {
    isListening.value = false
  })

  return {
    isSupported,
    isListening,
    isFinal,
    recognition,
    result,
    error,

    toggle,
    start,
    stop,
  }
}

export type UseSpeechRecognitionReturn = ReturnType<typeof useSpeechRecognition>
