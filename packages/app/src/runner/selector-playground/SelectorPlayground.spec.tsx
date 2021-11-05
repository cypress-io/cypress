import { createEventManager, createTestAutIframe } from '../../../cypress/e2e/support/ctSupport'
import SelectorPlayground from './SelectorPlayground.vue'

describe('SelectorPlayground', () => {
  it('renders nothing when messageTitle is undefined', () => {
    cy.mount(() => 
      <SelectorPlayground
        eventManager={createEventManager()}
        autIframe={createTestAutIframe()}
      />
    )
  })
})
