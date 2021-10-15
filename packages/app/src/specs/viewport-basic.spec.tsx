import { mount } from '@cypress/vue'
import { defineComponent, ref } from 'vue'

const Comp = defineComponent({
  setup () {
    const count = ref(0)

    return () => (
      <div>
        <p>{count.value}</p>
        <button onClick={() => count.value += 1}>Count</button>
      </div>
    )
  },
})

describe('basic', () => {
  it('works', () => {
    cy.viewport(500, 500)
    mount(Comp).then(() => {
      cy.get('button').click()
    })

    cy.viewport(700, 500)
    cy.get('p').contains(1)
    cy.get('button').click()
    cy.get('p').contains(2)
    cy.viewport(600, 500)
    cy.get('button').click()
    cy.get('p').contains(3)
  })
})
