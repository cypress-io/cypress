import { useElementSize } from '@vueuse/core'
import { computed, h, ref } from 'vue'

describe('does not fail due to unhandle ResizeObserver error', () => {
  it('uses resize observer successfully', ({ browser: 'chrome' }), (done) => {
    cy.spy((window.top as unknown as typeof globalThis).console, 'warn')

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
    .then(() => {
      expect((window.top as unknown as typeof globalThis).console.warn).to.be.calledWith(
        'Cypress is intentionally supressing and ignoring a unhandled ResizeObserver error. This can safely be ignored.',
      )

      done()
    })
  })
})
