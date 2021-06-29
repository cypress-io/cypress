// @ts-nocheck
import { h } from 'vue'
import { mount } from '@cypress/vue'

import CloseButton from '../../src/components/CloseButton.vue'

describe('CloseButton', () => {
  it('can be rendered and emits a click event', () => {
    const closeSpy = cy.spy().as('closeSpy')

    mount({
      render () {
        return h(CloseButton, { onClick: closeSpy })
      },
    })
    .get('[role=button]')
    .click()
    .get('@closeSpy')
    .should('have.been.called')
  })
})
