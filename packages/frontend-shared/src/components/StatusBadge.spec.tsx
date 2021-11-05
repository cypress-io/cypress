import { ref } from 'vue'
import StatusBadge from './StatusBadge.vue'
import Button from './Button.vue'

describe('<StatusBadge />', () => {
  it('playground', { viewportWidth: 500, viewportHeight: 200 }, () => {
    const status = ref(false)

    cy.mount(() => (
      <div class="p-6">
        <StatusBadge
          titleOn="configured"
          titleOff="not configured"
          status={status.value}
        />
        <br/>
        <Button onClick={() => status.value = !status.value}>toggle</Button>
      </div>
    ))

    cy.findByText('not configured').should('be.visible')
    cy.findByText('toggle').click()
    cy.findByText('configured').should('be.visible')
  })
})
