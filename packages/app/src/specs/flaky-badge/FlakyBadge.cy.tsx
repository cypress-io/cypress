import FlakyBadge from './FlakyBadge.vue'
import { defaultMessages } from '@cy/i18n'

const flakyBadgeTestId = 'flaky-badge'

describe('<FlakyBadge />', () => {
  it('should render expected content', () => {
    cy.mount(<FlakyBadge />)

    cy.findByTestId(flakyBadgeTestId)
    .should('have.text', defaultMessages.specPage.flaky.badgeLabel)
    .and('be.visible')
  })
})
