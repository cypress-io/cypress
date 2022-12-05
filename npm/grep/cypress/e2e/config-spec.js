// @ts-check
/// <reference types="cypress" />
describe('tests that use config object', () => {
  it('still works @config', { baseUrl: 'http://localhost:8000' }, () => {
    expect(Cypress.config('baseUrl')).to.equal('http://localhost:8000')
  })
})
