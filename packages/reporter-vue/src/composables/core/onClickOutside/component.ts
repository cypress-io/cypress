import { h, ref, defineComponent } from 'vue'
import { onClickOutside } from '@vueuse/core'

export const OnClickOutside = defineComponent({
  name: 'OnClickOutside',
  emits: ['trigger'],
  setup(props, { slots, emit }) {
    const target = ref()
    onClickOutside(target, (e) => {
      emit('trigger', e)
    })

    return () => {
      if (slots.default)
        return h('div', { ref: target }, slots.default())
    }
  },
})
