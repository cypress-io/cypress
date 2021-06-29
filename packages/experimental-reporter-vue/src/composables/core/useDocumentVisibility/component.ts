import { defineComponent, reactive } from 'vue'
import { useDocumentVisibility } from '@vueuse/core'

export const UseDocumentVisibility = defineComponent({
  name: 'UseDocumentVisibility',
  setup(props, { slots }) {
    const data = reactive({
      visibility: useDocumentVisibility(),
    })

    return () => {
      if (slots.default)
        return slots.default(data)
    }
  },
})
