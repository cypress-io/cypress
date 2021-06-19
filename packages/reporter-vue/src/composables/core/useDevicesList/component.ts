import { defineComponent, reactive } from 'vue'
import { useDevicesList, UseDevicesListOptions } from '@vueuse/core'

export const UseDevicesList = defineComponent<UseDevicesListOptions>({
  name: 'UseDevicesList',
  props: ['onUpdated', 'requestPermissions'] as unknown as undefined,
  setup(props, { slots }) {
    const data = reactive(useDevicesList(props))

    return () => {
      if (slots.default)
        return slots.default(data)
    }
  },
})
