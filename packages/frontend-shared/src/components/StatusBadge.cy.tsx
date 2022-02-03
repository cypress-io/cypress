import { ref } from 'vue'
import StatusBadge from './StatusBadge.vue'
import Button from './Button.vue'

describe('<StatusBadge />', () => {
  it('renders and toggles', { viewportWidth: 500, viewportHeight: 200 }, () => {
    const status = ref(false)

    cy.mount(() => (
      <div class="p-6">
        <StatusBadge
          titleOn="configured"
          titleOff="not configured"
          status={status.value}
        />
        <br /><br />
        {// @ts-ignore
        }<Button onClick={() => status.value = !status.value}>toggle</Button>
      </div>
    ))

    cy.findByText('not configured').should('be.visible')
    cy.percySnapshot()
    cy.findByText('toggle').click()
    cy.findByText('configured').should('be.visible')
    cy.percySnapshot()
  })
})
