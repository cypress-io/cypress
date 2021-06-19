---
category: Sensors
---

# useSpeechRecognition

Reactive [SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).

> [Can I use?](https://caniuse.com/mdn-api_speechrecognition)

## Usage

```ts
import { useSpeechRecognition } from '@vueuse/core'

const {
  isSupported,
  isListening,
  isFinal,
  result,
  start,
  stop
} = useSpeechRecognition()
```

### Options

The following shows the default values of the options, they will be directly passed to [SpeechRecognition API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).

```ts
{
  lang: 'en-US',
  interimResults: true,
  continuous: true,
}
```


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
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
export declare function useSpeechRecognition(
  options?: SpeechRecognitionOptions
): {
  isSupported: boolean
  isListening: Ref<boolean>
  isFinal: Ref<boolean>
  recognition: SpeechRecognition | undefined
  result: Ref<string>
  error: Ref<SpeechRecognitionErrorEvent | undefined>
  toggle: (value?: boolean) => void
  start: () => void
  stop: () => void
}
export declare type UseSpeechRecognitionReturn = ReturnType<
  typeof useSpeechRecognition
>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useSpeechRecognition/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useSpeechRecognition/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useSpeechRecognition/index.md)


<!--FOOTER_ENDS-->
