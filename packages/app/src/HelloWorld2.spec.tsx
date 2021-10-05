import { mount } from '@cypress/vue'
import { defineComponent, h, ref } from 'vue'

describe('hello 2', () => {
  it('works', () => {
    const Comp = defineComponent({
      setup() {
        const count = ref(0)
        return () => h('div', [
          h('button', { onClick: () => count.value++ }, `Count: ${count.value}`)
        ])
      }
    })
    mount(Comp)
    .then(() => cy.get('button').click())
    .then(() => {
      cy.get('button').contains('Count: 1')
    })
  })
})