/* this implementation is original ported from https://github.com/logaretm/vue-use-web by Abdelrahman Awad */

import { MaybeRef } from '../../shared'
import { watch, Ref, ref, shallowRef } from 'vue'
import { ConfigurableNavigator, defaultNavigator } from '../_configurable'

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
  videoDeviceId?: MaybeRef<string | undefined | false | 'none'>
  /**
   * The device id of audi input
   *
   * When passing with `undefined` the default device will be used.
   * Pass `false` or "none" to disabled audi input
   *
   * @default undefined
   */
  audioDeviceId?: MaybeRef<string | undefined | false | 'none'>
}

/**
 * Reactive `mediaDevices.getUserMedia` streaming
 *
 * @see https://vueuse.org/useUserMedia
 * @param options
 */
export function useUserMedia(options: UseUserMediaOptions = {}) {
  let enabledV: any = false
  if (options.enabled) {
    enabledV = options.enabled
  }

  let autoSwitchV: any = false
  if (options.autoSwitch) {
    enabledV = options.autoSwitch
  }

  const enabled = ref(enabledV)
  const autoSwitch = ref(autoSwitchV)
  const videoDeviceId = ref(options.videoDeviceId)
  const audioDeviceId = ref(options.audioDeviceId)
  const { navigator = defaultNavigator } = options
  const isSupported = Boolean(navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia)

  const stream: Ref<MediaStream | undefined> = shallowRef()

  function getDeviceOptions(device: Ref<string | undefined | false | 'none'>) {
    if (device.value === 'none' || device.value === false)
      return false
    if (device.value == null)
      return true
    return {
      deviceId: device.value,
    }
  }

  async function _start() {
    if (!isSupported || stream.value)
      return
    stream.value = await navigator!.mediaDevices.getUserMedia({
      video: getDeviceOptions(videoDeviceId),
      audio: getDeviceOptions(audioDeviceId),
    })
    return stream.value
  }

  async function _stop() {
    stream.value && stream.value.getTracks().forEach(t => t.stop())
    stream.value = undefined
  }

  function stop() {
    _stop()
    enabled.value = false
  }

  async function start() {
    await _start()
    if (stream.value)
      enabled.value = true
    return stream.value
  }

  async function restart() {
    _stop()
    return await start()
  }

  watch(
    enabled,
    (v) => {
      if (v)
        _start()
      else
        _stop()
    },
    { immediate: true },
  )

  watch(
    [videoDeviceId, audioDeviceId],
    () => {
      if (autoSwitch.value && stream.value)
        restart()
    },
    { immediate: true },
  )

  return {
    isSupported,
    stream,
    start,
    stop,
    restart,
    videoDeviceId,
    audioDeviceId,
    enabled,
    autoSwitch,
  }
}

export type UseUserMediaReturn = ReturnType<typeof useUserMedia>
