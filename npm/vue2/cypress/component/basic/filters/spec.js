/// <reference types="cypress" />
import { mountCallback } from '@cypress/vue'
import { reverse } from './reverse'

describe('Global filters', () => {
  const filters = {
    reverse,
  }

  // use reverse filter in template
  const template = `
    <div>{{ "foo-bar" | reverse }}</div>
  `

  // extend Vue with global filters
  const extensions = {
    filters,
  }

  beforeEach(mountCallback({ template }, { extensions }))

  it('registers global filter', () => {
    cy.wrap(window.Vue)
    .invoke('filter', 'reverse')
    .should('equal', filters.reverse)
  })

  it('tests the reverse function', () => {
    expect(reverse('Hello')).to.equal('olleH')
  })

  it('reverses the string', () => {
    cy.contains('rab-oof')
  })
})
