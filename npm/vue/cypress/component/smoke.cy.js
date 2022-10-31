import { mount } from '@cypress/vue'
import { h, defineComponent } from 'vue'

describe('smoke test', () => {
  it('mounts with no options', () => {
    const comp = defineComponent({
      setup () {
        return () => h('div', 'hello world')
      },
    })

    mount(comp)

    cy.get('div').contains('hello world')
  })
})
