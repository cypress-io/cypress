import { h, ref, defineComponent, reactive } from 'vue'
import { useMouseInElement, MouseInElementOptions } from '@vueuse/core'

export const UseMouseInElement = defineComponent<MouseInElementOptions>({
  name: 'UseMouseElement',
  props: ['handleOutside'] as unknown as undefined,
  setup(props, { slots }) {
    const target = ref()
    const data = reactive(useMouseInElement(target, props))

    return () => {
      if (slots.default)
        return h('div', { ref: target }, slots.default(data))
    }
  },
})
