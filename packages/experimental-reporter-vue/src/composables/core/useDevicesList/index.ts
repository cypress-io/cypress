/* this implementation is original ported from https://github.com/logaretm/vue-use-web by Abdelrahman Awad */

import { computed, ComputedRef, Ref, ref } from 'vue'
import { useEventListener } from '../useEventListener'
import { usePermission } from '../usePermission'
import { ConfigurableNavigator, defaultNavigator } from '../_configurable'

export interface UseDevicesListOptions extends ConfigurableNavigator {
  onUpdated?: (devices: MediaDeviceInfo[]) => void
  /**
   * Request for permissions immediately if it's not granted,
   * otherwise label and deviceIds could be empty
   *
   * @default false
   */
  requestPermissions?: boolean
}

export interface UseDevicesListReturn {
  /**
   * All devices
   */
  devices: Ref<MediaDeviceInfo[]>
  videoInputs: ComputedRef<MediaDeviceInfo[]>
  audioInputs: ComputedRef<MediaDeviceInfo[]>
  audioOutputs: ComputedRef<MediaDeviceInfo[]>
  permissionGranted: Ref<boolean>
  ensurePermissions: () => Promise<boolean>
  isSupported: boolean
}

/**
 * Reactive `enumerateDevices` listing avaliable input/output devices
 *
 * @see https://vueuse.org/useDevicesList
 * @param options
 */
export function useDevicesList(options: UseDevicesListOptions = {}): UseDevicesListReturn {
  const {
    navigator = defaultNavigator,
    requestPermissions = false,
    onUpdated,
  } = options

  const devices = ref([]) as Ref<MediaDeviceInfo[]>
  const videoInputs = computed(() => devices.value.filter(i => i.kind === 'videoinput'))
  const audioInputs = computed(() => devices.value.filter(i => i.kind === 'audioinput'))
  const audioOutputs = computed(() => devices.value.filter(i => i.kind === 'audiooutput'))
  let isSupported = false
  const permissionGranted = ref(false)

  async function update() {
    if (!isSupported)
      return

    devices.value = await navigator!.mediaDevices.enumerateDevices()
    onUpdated && onUpdated(devices.value)
  }

  async function ensurePermissions() {
    if (!isSupported)
      return false

    if (permissionGranted.value)
      return true

    const { state, query } = usePermission('camera', { controls: true })
    await query()
    if (state.value !== 'granted') {
      const stream = await navigator!.mediaDevices.getUserMedia({ audio: true, video: true })
      stream.getTracks().forEach(t => t.stop())
      update()
      permissionGranted.value = true
    }
    else {
      permissionGranted.value = true
    }

    return permissionGranted.value
  }

  if (navigator) {
    isSupported = Boolean(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices)

    if (isSupported) {
      if (requestPermissions)
        ensurePermissions()

      useEventListener(navigator.mediaDevices, 'devicechange', update)
      update()
    }
  }

  return {
    devices,
    ensurePermissions,
    permissionGranted,
    videoInputs,
    audioInputs,
    audioOutputs,
    isSupported,
  }
}
