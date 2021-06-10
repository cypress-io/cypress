// @ts-nocheck
import { h } from 'vue'
import { mount } from '@cypress/vue'

import NewUserWelcome from '../../src/components/NewUserWelcome.vue'

describe('NewUserWelcome', () => {
  beforeEach(() => {
    const closeSpy = cy.spy().as('closeSpy')

    mount({
      render () {
        return h(NewUserWelcome, { onClose: closeSpy })
      },
    })
  })

  it('emits close when No Thanks text is clicked', () => {
    cy
    .get('[data-cy=closeWithText]')
    .click()
    .get('@closeSpy')
    .should('have.been.called')
  })

  it('emits close when x button clicked', () => {
    cy
    .get('[data-cy=closeWithButton]')
    .click()
    .get('@closeSpy')
    .should('have.been.called')
  })

  it('opens helper modal that can be closed by X button', () => {
    cy
    .get('[data-cy=openHelper]')
    .click()
    .get('[role=dialog]')
    .should('exist')
    .get('[role=dialog] [role=button]')
    .click()
    .get('[role=dialog]')
    .should('not.exist')
  })
})
