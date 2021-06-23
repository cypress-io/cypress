---
category: Browser
---

# useMediaControls

Reactive media controls for both `audio` and `video` elements

## Usage

### Basic Usage
```html
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useMediaControls } from '@vueuse/core'

const video = ref()
const { playing, currentTime, duration, volume } = useMediaControls(video, { 
  src: 'video.mp4',
})

// Change initial media properties
onMounted(() => {
  volume.value = 0.5
  currentTime.value = 60
})
</script>

<template>
  <video ref="video" />
  <button @click="playing = !playing">Play / Pause</button>
  <span>{{ currentTime }} / {{ duration }}</span>
</template>
```

### Proving Captions, Subtitles, etc...
You can provide captions, subtitles, etc in the `tracks` options of the
`useMediaControls` function. The function will return an array of tracks
along with two functions for controlling them, `enableTrack`, `disableTrack`, and `selectedTrack`.
Using these you can manage the currently selected track. `selectedTrack` will
be `-1` if there is no selected track.

```html
<script setup lang="ts">
const { tracks, enableTrack } = useMediaControls(video, { 
  src: 'video.mp4',
  tracks: [
    {
      default: true,
      src: './subtitles.vtt',
      kind: 'subtitles',
      label: 'English',
      srcLang: 'en',
    },
  ]
})
</script>

<template>
  <video ref="video" />
  <button v-for="track in tacks" :key="track.id" @click="enableTrack(track)">
    {{ track.label }}
  </button>
</template>
```


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
/**
 * Many of the jsdoc definitions here are modified version of the
 * documentation from MDN(https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement)
 */
export interface UseMediaSource {
  /**
   * The source url for the media
   */
  src: string
  /**
   * The media codec type
   */
  type?: string
}
export interface UseMediaTextTrackSource {
  /**
   * Indicates that the track should be enabled unless the user's preferences indicate
   * that another track is more appropriate
   */
  default?: boolean
  /**
   * How the text track is meant to be used. If omitted the default kind is subtitles.
   */
  kind: TextTrackKind
  /**
   * A user-readable title of the text track which is used by the browser
   * when listing available text tracks.
   */
  label: string
  /**
   * Address of the track (.vtt file). Must be a valid URL. This attribute
   * must be specified and its URL value must have the same origin as the document
   */
  src: string
  /**
   * Language of the track text data. It must be a valid BCP 47 language tag.
   * If the kind attribute is set to subtitles, then srclang must be defined.
   */
  srcLang: string
}
interface UseMediaControlsOptions extends ConfigurableDocument {
  /**
   * The source for the media, may either be a string, a `UseMediaSource` object, or a list
   * of `UseMediaSource` objects.
   */
  src?: MaybeRef<string | UseMediaSource | UseMediaSource[]>
  /**
   * A list of text tracks for the media
   */
  tracks?: MaybeRef<UseMediaTextTrackSource[]>
}
export interface UseMediaTextTrack {
  /**
   * The index of the text track
   */
  id: number
  /**
   * The text track label
   */
  label: string
  /**
   * Language of the track text data. It must be a valid BCP 47 language tag.
   * If the kind attribute is set to subtitles, then srclang must be defined.
   */
  language: string
  /**
   * Specifies the display mode of the text track, either `disabled`,
   * `hidden`, or `showing`
   */
  mode: TextTrackMode
  /**
   * How the text track is meant to be used. If omitted the default kind is subtitles.
   */
  kind: TextTrackKind
  /**
   * Indicates the track's in-band metadata track dispatch type.
   */
  inBandMetadataTrackDispatchType: string
  /**
   * A list of text track cues
   */
  cues: TextTrackCueList | null
  /**
   * A list of active text track cues
   */
  activeCues: TextTrackCueList | null
}
export declare function useMediaControls(
  target: MaybeRef<HTMLMediaElement | null | undefined>,
  options?: UseMediaControlsOptions
): {
  currentTime: Ref<number>
  duration: Ref<number>
  buffering: Ref<boolean>
  waiting: Ref<boolean>
  seeking: Ref<boolean>
  ended: Ref<boolean>
  stalled: Ref<boolean>
  buffered: Ref<[number, number][]>
  playing: Ref<boolean>
  volume: Ref<number>
  muted: Ref<boolean>
  tracks: Ref<
    {
      id: number
      label: string
      language: string
      mode: TextTrackMode
      kind: TextTrackKind
      inBandMetadataTrackDispatchType: string
      cues:
        | ({
            [x: number]: {
              endTime: number
              id: string
              onenter: ((this: TextTrackCue, ev: Event) => any) | null
              onexit: ((this: TextTrackCue, ev: Event) => any) | null
              pauseOnExit: boolean
              startTime: number
              readonly track: {
                readonly activeCues:
                  | (any & {
                      [Symbol.iterator]: () => IterableIterator<TextTrackCue>
                    })
                  | null
                readonly cues:
                  | (any & {
                      [Symbol.iterator]: () => IterableIterator<TextTrackCue>
                    })
                  | null
                readonly id: string
                readonly inBandMetadataTrackDispatchType: string
                readonly kind: TextTrackKind
                readonly label: string
                readonly language: string
                mode: TextTrackMode
                oncuechange: ((this: TextTrack, ev: Event) => any) | null
                addCue: (cue: TextTrackCue) => void
                removeCue: (cue: TextTrackCue) => void
                addEventListener: {
                  <K extends "cuechange">(
                    type: K,
                    listener: (
                      this: TextTrack,
                      ev: TextTrackEventMap[K]
                    ) => any,
                    options?: boolean | AddEventListenerOptions | undefined
                  ): void
                  (
                    type: string,
                    listener: EventListenerOrEventListenerObject,
                    options?: boolean | AddEventListenerOptions | undefined
                  ): void
                }
                removeEventListener: {
                  <K_1 extends "cuechange">(
                    type: K_1,
                    listener: (
                      this: TextTrack,
                      ev: TextTrackEventMap[K_1]
                    ) => any,
                    options?: boolean | EventListenerOptions | undefined
                  ): void
                  (
                    type: string,
                    listener: EventListenerOrEventListenerObject,
                    options?: boolean | EventListenerOptions | undefined
                  ): void
                }
                dispatchEvent: (event: Event) => boolean
              } | null
              addEventListener: {
                <K_2 extends keyof TextTrackCueEventMap>(
                  type: K_2,
                  listener: (
                    this: TextTrackCue,
                    ev: TextTrackCueEventMap[K_2]
                  ) => any,
                  options?: boolean | AddEventListenerOptions | undefined
                ): void
                (
                  type: string,
                  listener: EventListenerOrEventListenerObject,
                  options?: boolean | AddEventListenerOptions | undefined
                ): void
              }
              removeEventListener: {
                <K_3 extends keyof TextTrackCueEventMap>(
                  type: K_3,
                  listener: (
                    this: TextTrackCue,
                    ev: TextTrackCueEventMap[K_3]
                  ) => any,
                  options?: boolean | EventListenerOptions | undefined
                ): void
                (
                  type: string,
                  listener: EventListenerOrEventListenerObject,
                  options?: boolean | EventListenerOptions | undefined
                ): void
              }
              dispatchEvent: (event: Event) => boolean
            }
            readonly length: number
            getCueById: (id: string) => TextTrackCue | null
            [Symbol.iterator]: () => IterableIterator<TextTrackCue>
          } & {
            [Symbol.iterator]: () => IterableIterator<TextTrackCue>
          })
        | null
      activeCues:
        | ({
            [x: number]: {
              endTime: number
              id: string
              onenter: ((this: TextTrackCue, ev: Event) => any) | null
              onexit: ((this: TextTrackCue, ev: Event) => any) | null
              pauseOnExit: boolean
              startTime: number
              readonly track: {
                readonly activeCues:
                  | (any & {
                      [Symbol.iterator]: () => IterableIterator<TextTrackCue>
                    })
                  | null
                readonly cues:
                  | (any & {
                      [Symbol.iterator]: () => IterableIterator<TextTrackCue>
                    })
                  | null
                readonly id: string
                readonly inBandMetadataTrackDispatchType: string
                readonly kind: TextTrackKind
                readonly label: string
                readonly language: string
                mode: TextTrackMode
                oncuechange: ((this: TextTrack, ev: Event) => any) | null
                addCue: (cue: TextTrackCue) => void
                removeCue: (cue: TextTrackCue) => void
                addEventListener: {
                  <K extends "cuechange">(
                    type: K,
                    listener: (
                      this: TextTrack,
                      ev: TextTrackEventMap[K]
                    ) => any,
                    options?: boolean | AddEventListenerOptions | undefined
                  ): void
                  (
                    type: string,
                    listener: EventListenerOrEventListenerObject,
                    options?: boolean | AddEventListenerOptions | undefined
                  ): void
                }
                removeEventListener: {
                  <K_1 extends "cuechange">(
                    type: K_1,
                    listener: (
                      this: TextTrack,
                      ev: TextTrackEventMap[K_1]
                    ) => any,
                    options?: boolean | EventListenerOptions | undefined
                  ): void
                  (
                    type: string,
                    listener: EventListenerOrEventListenerObject,
                    options?: boolean | EventListenerOptions | undefined
                  ): void
                }
                dispatchEvent: (event: Event) => boolean
              } | null
              addEventListener: {
                <K_2 extends keyof TextTrackCueEventMap>(
                  type: K_2,
                  listener: (
                    this: TextTrackCue,
                    ev: TextTrackCueEventMap[K_2]
                  ) => any,
                  options?: boolean | AddEventListenerOptions | undefined
                ): void
                (
                  type: string,
                  listener: EventListenerOrEventListenerObject,
                  options?: boolean | AddEventListenerOptions | undefined
                ): void
              }
              removeEventListener: {
                <K_3 extends keyof TextTrackCueEventMap>(
                  type: K_3,
                  listener: (
                    this: TextTrackCue,
                    ev: TextTrackCueEventMap[K_3]
                  ) => any,
                  options?: boolean | EventListenerOptions | undefined
                ): void
                (
                  type: string,
                  listener: EventListenerOrEventListenerObject,
                  options?: boolean | EventListenerOptions | undefined
                ): void
              }
              dispatchEvent: (event: Event) => boolean
            }
            readonly length: number
            getCueById: (id: string) => TextTrackCue | null
            [Symbol.iterator]: () => IterableIterator<TextTrackCue>
          } & {
            [Symbol.iterator]: () => IterableIterator<TextTrackCue>
          })
        | null
    }[]
  >
  selectedTrack: Ref<number>
  enableTrack: (
    track: number | UseMediaTextTrack,
    disableTracks?: boolean
  ) => void
  disableTrack: (track?: number | UseMediaTextTrack | undefined) => void
  supportsPictureInPicture: boolean | undefined
  togglePictureInPicture: () => Promise<unknown>
  isPictureInPicture: Ref<boolean>
  onSourceError: EventHookOn<Event>
}
export declare type UseMediaControlsReturn = ReturnType<typeof useMediaControls>
export {}
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useMediaControls/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useMediaControls/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useMediaControls/index.md)


<!--FOOTER_ENDS-->
