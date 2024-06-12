import { ref } from 'vue'
import StatusBadge from './StatusBadge.vue'
import Button from '../components/Button.vue'

describe('<StatusBadge />', () => {
  it('renders and toggles', { viewportWidth: 500, viewportHeight: 200 }, () => {
    const status = ref(false)
    const title = ref('not configured')

    function onClick () {
      status.value = !status.value
      title.value = 'configured'
    }

    cy.mount(() => (
      <div class="p-6">
        <StatusBadge
          title={title.value}
          status={status.value}
        />
        <br /><br />
        {
          // @ts-ignore
          <Button onClick={onClick}>toggle</Button>
        }
      </div>
    ))

    cy.findByText('not configured').should('be.visible')
    cy.findByText('toggle').click()
    cy.findByText('configured').should('be.visible')
  })
})
