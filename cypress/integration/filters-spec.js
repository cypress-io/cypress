const mountVue = require('../..')

/* eslint-env mocha */
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
  beforeEach(mountVue({template}, { extensions }))

  it('registers global filter', () => {
    cy.window().its('Vue')
      .invoke('filter', 'reverse')
      .should('equal', filters.reverse)
  })

  it('reverses the string', () => {
    cy.contains('rab-oof')
  })
})
