import { defineComponent, reactive } from 'vue'
import { useDevicePixelRatio } from '@vueuse/core'

export const UseDevicePixelRatio = defineComponent({
  name: 'UseDevicePixelRatio',
  setup(props, { slots }) {
    const data = reactive({
      pixelRatio: useDevicePixelRatio(),
    })

    return () => {
      if (slots.default)
        return slots.default(data)
    }
  },
})
