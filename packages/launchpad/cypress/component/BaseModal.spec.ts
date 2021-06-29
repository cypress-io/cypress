// @ts-nocheck
import { h } from 'vue'
import { mount } from '@cypress/vue'

import BaseModal from '../../src/components/BaseModal.vue'

describe('BaseModal', () => {
  it('can be closed when clicking on the close button or outside of the modal', () => {
    const closeSpy = cy.spy().as('closeSpy')
    // TODO: Setup TSX with webpack :-(
    const wrapper = {
      render () {
        return h('div',
          [
            h('h1', 'Body Content'),
            h(BaseModal, {
              onClose: closeSpy,
            }, 'Inner Content'),
          ])
      },
    }

    mount(wrapper)
    .get('[role=button]')
    .click()
    .get('@closeSpy')
    .should('have.been.called')
    .get('body')
    .click()
    .get('@closeSpy')
    .should('have.been.called')
  })
})
