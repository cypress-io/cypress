/// <reference types="cypress" />
it('has expected expose configuration', () => {
  expect(Cypress.expose('CY_EXPOSE_FOO')).to.equal('foo')
  expect(Cypress.expose('CY_EXPOSE_BAR')).to.equal('bar')
  expect(Cypress.expose('CY_EXPOSE_ONE')).to.equal(1)
})
