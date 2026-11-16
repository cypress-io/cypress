import FlakyBadge from './FlakyBadge.vue'

const flakyBadgeTestId = 'flaky-badge'

describe('<FlakyBadge />', () => {
  it('should render expected content', () => {
    cy.mount(<FlakyBadge />)

    cy.findByTestId(flakyBadgeTestId)
    .should('have.text', 'Flaky')
    .and('be.visible')
  })
})
