import PromoAction from './PromoAction.vue'
import { IconChevronRightSmall, IconActionRestart, IconObjectTassel } from '@cypress-design/vue-icon'

describe('<PromoAction />', () => {
  it('next', () => {
    const action = cy.stub().as('action')

    cy.mount(
      <PromoAction
        action={action}
        leftLabel="1 of 3"
        rightLabel="Next"
        rightIcon={IconChevronRightSmall}
      />,
    )

    cy.get('@action').should('not.have.been.called')

    cy.findByTestId('promo-action').click()

    cy.get('@action').should('have.been.calledOnce')
  })

  it('reset', () => {
    const action = cy.stub().as('action')

    cy.mount(
      <PromoAction
        action={action}
        leftIcon={IconActionRestart}
        rightLabel="Reset"
      />,
    )

    cy.get('@action').should('not.have.been.called')

    cy.findByTestId('promo-action').click()

    cy.get('@action').should('have.been.calledOnce')
  })

  it('tour', () => {
    cy.mount(
      <PromoAction
        href="#test"
        leftIcon={IconObjectTassel}
        rightLabel="View tour"
      />,
    )

    cy.get('a').should('have.attr', 'href', '#test')
  })
})
