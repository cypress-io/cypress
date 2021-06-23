import { defineComponent, reactive } from 'vue'
import { usePreferredColorScheme } from '@vueuse/core'

export const UsePreferredColorScheme = defineComponent({
  name: 'UsePreferredColorScheme',
  setup(props, { slots }) {
    const data = reactive({
      colorScheme: usePreferredColorScheme(),
    })

    return () => {
      if (slots.default)
        return slots.default(data)
    }
  },
})
