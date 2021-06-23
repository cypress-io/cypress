---
category: Sensors
---

# useUserMedia

Reactive [`mediaDevices.getUserMedia`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) streaming.

## Usage

```js
import { useUserMedia } from '@vueuse/core'

const { stream, start } = useUserMedia()

start()
```

```ts
const video = document.getElementById('video')

watchEffect(() => {
  // preview on a video element
  video.srcObject = stream.value
})
```

### Devices

```js
import { useUserMedia, useDevicesList } from '@vueuse/core'

const {
  videoInputs: cameras,
  audioInputs: microphones,
} = useDevicesList({
  requestPermissions: true,
})
const currentCamera = computed(() => cameras.value[0]?.deviceId)
const currentMicrophone = computed(() => microphones.value[0]?.deviceId)

const { stream } = useUserMedia({
  videoDeviceId: currentCamera,
  audioDeviceId: currentMicrophone,
})
```

## Related

- `useDevicesList`
- `usePermission`

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface UseUserMediaOptions extends ConfigurableNavigator {
  /**
   * If the stream is enabled
   * @default false
   */
  enabled?: MaybeRef<boolean>
  /**
   * Recreate stream when the input devices id changed
   *
   * @default true
   */
  autoSwitch?: MaybeRef<boolean>
  /**
   * The device id of video input
   *
   * When passing with `undefined` the default device will be used.
   * Pass `false` or "none" to disabled video input
   *
   * @default undefined
   */
  videoDeviceId?: MaybeRef<string | undefined | false | "none">
  /**
   * The device id of audi input
   *
   * When passing with `undefined` the default device will be used.
   * Pass `false` or "none" to disabled audi input
   *
   * @default undefined
   */
  audioDeviceId?: MaybeRef<string | undefined | false | "none">
}
/**
 * Reactive `mediaDevices.getUserMedia` streaming
 *
 * @see https://vueuse.org/useUserMedia
 * @param options
 */
export declare function useUserMedia(options?: UseUserMediaOptions): {
  isSupported: boolean
  stream: Ref<MediaStream | undefined>
  start: () => Promise<MediaStream | undefined>
  stop: () => void
  restart: () => Promise<MediaStream | undefined>
  videoDeviceId: Ref<string | false | undefined>
  audioDeviceId: Ref<string | false | undefined>
  enabled: Ref<boolean>
  autoSwitch: Ref<boolean>
}
export declare type UseUserMediaReturn = ReturnType<typeof useUserMedia>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useUserMedia/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useUserMedia/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useUserMedia/index.md)


<!--FOOTER_ENDS-->
