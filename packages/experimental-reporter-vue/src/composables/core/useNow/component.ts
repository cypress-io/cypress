import { defineComponent, reactive } from 'vue'
import { useNow, UseNowOptions } from '@vueuse/core'

export const UseNow = defineComponent<Omit<UseNowOptions<true>, 'controls'>>({
  name: 'UseNow',
  props: ['interval'] as unknown as undefined,
  setup(props, { slots }) {
    const data = reactive(useNow({ ...props, controls: true }))

    return () => {
      if (slots.default)
        return slots.default(data)
    }
  },
})
