import { defineComponent, reactive } from 'vue'
import { useGeolocation, GeolocationOptions } from '@vueuse/core'

export const UseGeolocation = defineComponent<GeolocationOptions>({
  name: 'UseGeolocation',
  props: ['enableHighAccuracy', 'maximumAge', 'timeout', 'navigator'] as unknown as undefined,
  setup(props, { slots }) {
    const data = reactive(useGeolocation(props))
    return () => {
      if (slots.default)
        return slots.default(data)
    }
  },
})
