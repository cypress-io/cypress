import { h, ref, defineComponent, reactive } from 'vue'
import { useElementVisibility } from '@vueuse/core'

export const UseElementVisibility = defineComponent({
  name: 'UseElementVisibility',
  setup(props, { slots }) {
    const target = ref()
    const data = reactive({
      isVisible: useElementVisibility(target),
    })

    return () => {
      if (slots.default)
        return h('div', { ref: target }, slots.default(data))
    }
  },
})
