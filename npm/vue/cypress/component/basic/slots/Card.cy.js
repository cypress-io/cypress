// In this test file we demo how to test a component with slots and a scoped slot.

// Usage is the same as Vue Test Utils, since slots and scopedSlots
// in the render options are directly passed through to the Utils mount().

/// <reference types="cypress" />

import { h } from 'vue'
import Card from './Card.vue'
import { mount } from '@cypress/vue'

describe('Card', () => {
  it('skipped slots', () => {
    mount(Card)
    cy.contains('Nothing used the Scoped content!').should('be.visible')
  })

  it('renders slots', () => {
    // TODO: use HTML syntax (not render function with `h`)
    // when it's working.
    // Blocked by upstream bug in Test Utils: https://github.com/vuejs/test-utils/issues/1166
    // mount(Card, {
    //   slots: {
    //     header: `<h1>HEADER</h1>`
    //   },
    // })
    mount(Card, {
      slots: {
        header: () => h('h1', 'HEADER'),
        footer: () => h('div', 'FOOTER'),
      },
    })

    cy.contains('h1', 'HEADER')
    cy.contains('div', 'FOOTER')
  })

  it('renders scopedSlots', () => {
    mount(Card, {
      slots: {
        default: ({ content }) => h('div', {}, h('p', `Yay! ${content}`)),
      },
    })

    cy.contains('Yay! Scoped content!').should('be.visible')
    cy.contains('Nothing used the Scoped content!').should('not.exist')
  })
})
