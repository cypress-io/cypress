import { defineComponent, reactive } from 'vue'
import { useWindowSize, WindowSizeOptions } from '@vueuse/core'

export const UseWindowSize = defineComponent<WindowSizeOptions>({
  name: 'UseWindowSize',
  props: ['initialWidth', 'initialHeight'] as unknown as undefined,
  setup(props, { slots }) {
    const data = reactive(useWindowSize(props))

    return () => {
      if (slots.default)
        return slots.default(data)
    }
  },
})
