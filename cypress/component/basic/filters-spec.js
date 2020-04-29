import {mountCallback} from 'cypress-vue-unit-test'

describe('Global filters', () => {
  const filters = {
    reverse: s =>
      s.split('').reverse().join('')
  }

  // use reverse filter in template
  const template = `
    <div>{{ "foo-bar" | reverse }}</div>
  `

  // extend Vue with global filters
  const extensions = {
    filters
  }
  beforeEach(mountCallback({template}, { extensions }))

  it('registers global filter', () => {
    cy.wrap(window.Vue)
    // cy.window().its('Vue')
      .invoke('filter', 'reverse')
      .should('equal', filters.reverse)
  })

  it('reverses the string', () => {
    cy.contains('rab-oof')
  })
})
