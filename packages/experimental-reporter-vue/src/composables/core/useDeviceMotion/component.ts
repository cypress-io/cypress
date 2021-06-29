import { defineComponent, reactive } from 'vue'
import { useDeviceMotion } from '@vueuse/core'

export const UseDeviceMotion = defineComponent({
  name: 'UseDeviceMotion',
  setup(props, { slots }) {
    const data = reactive(useDeviceMotion())

    return () => {
      if (slots.default)
        return slots.default(data)
    }
  },
})
