import { defineComponent, reactive } from 'vue'
import { usePageLeave } from '@vueuse/core'

export const UsePageLeave = defineComponent({
  name: 'UsePageLeave',
  setup(props, { slots }) {
    const data = reactive({
      isLeft: usePageLeave(),
    })

    return () => {
      if (slots.default)
        return slots.default(data)
    }
  },
})
