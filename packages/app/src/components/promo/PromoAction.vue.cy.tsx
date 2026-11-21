import PromoAction from './PromoAction.vue'
import { IconChevronRightSmall, IconActionRestart } from '@cypress-design/vue-icon'

describe('<PromoAction />', () => {
  it('left label, right icon', () => {
    const action = cy.stub().as('action')

    cy.mount(
      <PromoAction
        action={action}
        leftLabel="1 of 3"
        rightLabel="Next"
        rightIcon={IconChevronRightSmall}
        class="m-[8px]"
      />,
    )

    cy.get('@action').should('not.have.been.called')

    cy.findByTestId('promo-action-control').click()

    cy.get('@action').should('have.been.calledOnce')
  })

  it('left icon, right label', () => {
    const action = cy.stub().as('action')

    cy.mount(
      <PromoAction
        action={action}
        leftIcon={IconActionRestart}
        rightLabel="Reset"
        class="m-[8px]"
      />,
    )

    cy.get('@action').should('not.have.been.called')

    cy.findByTestId('promo-action-control').click()

    cy.get('@action').should('have.been.calledOnce')
  })
})
