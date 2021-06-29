import { defineComponent, reactive } from 'vue'
import { usePreferredLanguages } from '@vueuse/core'

export const UsePreferredLanguages = defineComponent({
  name: 'UsePreferredLanguages',
  setup(props, { slots }) {
    const data = reactive({
      languages: usePreferredLanguages(),
    })

    return () => {
      if (slots.default)
        return slots.default(data)
    }
  },
})
