import { h, ref, defineComponent, reactive } from 'vue'
import { useFullscreen } from '@vueuse/core'

export const UseFullscreen = defineComponent({
  name: 'UseFullscreen',
  setup(props, { slots }) {
    const target = ref()
    const data = reactive(useFullscreen(target))

    return () => {
      if (slots.default)
        return h('div', { ref: target }, slots.default(data))
    }
  },
})
