import { defineComponent, reactive } from 'vue'
import { useBrowserLocation } from '@vueuse/core'

export const UseBrowserLocation = defineComponent({
  name: 'UseBrowserLocation',
  setup(props, { slots }) {
    const data = reactive(useBrowserLocation())

    return () => {
      if (slots.default)
        return slots.default(data)
    }
  },
})
