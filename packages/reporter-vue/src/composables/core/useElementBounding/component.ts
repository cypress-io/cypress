import { h, ref, defineComponent, reactive } from 'vue'
import { useElementBounding } from '@vueuse/core'
import { ResizeObserverOptions } from '../useResizeObserver'

export const UseElementBounding = defineComponent<ResizeObserverOptions>({
  name: 'UseElementBounding',
  props: ['box'] as unknown as undefined,
  setup(props, { slots }) {
    const target = ref()
    const data = reactive(useElementBounding(target, props))

    return () => {
      if (slots.default)
        return h('div', { ref: target }, slots.default(data))
    }
  },
})
