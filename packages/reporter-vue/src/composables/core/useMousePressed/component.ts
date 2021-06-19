import { h, ref, defineComponent, reactive } from 'vue'
import { useMousePressed, MousePressedOptions } from '@vueuse/core'

export const UseMousePressed = defineComponent<Omit<MousePressedOptions, 'target'>>({
  name: 'UseMousePressed',
  props: ['touch', 'initialValue'] as unknown as undefined,
  setup(props, { slots }) {
    const target = ref()
    const data = reactive(useMousePressed({ ...props, target }))

    return () => {
      if (slots.default)
        return h('div', { ref: target }, slots.default(data))
    }
  },
})
