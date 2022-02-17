import { useElementSize } from '@vueuse/core'
import { computed, h, ref } from 'vue'

describe('reproduction', () => {
  it('uses resize observer', () => {
    const left = ref()
    const right = ref()

    useElementSize(right)

    const { width } = useElementSize(left)
    const inputOffset = computed(() => width.value)

    const d1 = () => h('div', { ref: left })
    const d2 = () => h('div', {
      ref: right,
      style: {
        paddingLeft: `${inputOffset.value }px`,
      },
    })

    cy.mount({
      render () {
        return [h(d1), h(d2)]
      },
    })
  })
})
