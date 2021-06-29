import { defineComponent, reactive } from 'vue'
import { useTimestamp, TimestampOptions } from '@vueuse/core'

export const UseTimestamp = defineComponent<Omit<TimestampOptions<true>, 'controls'>>({
  name: 'UseTimestamp',
  props: ['interval', 'offset'] as unknown as undefined,
  setup(props, { slots }) {
    const data = reactive(useTimestamp({ ...props, controls: true }))

    return () => {
      if (slots.default)
        return slots.default(data)
    }
  },
})
