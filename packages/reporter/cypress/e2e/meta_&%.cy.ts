// this ensures that special characters in the spec title are displayed
// properly. it tests the actual reporter instead of the AUT like other tests
describe('special characters', () => {
  it('displays file name with decoded special characters', () => {
    cy.wrap(Cypress.$(window.top.document.body))
    .find('.reporter .runnable-header')
    .contains('meta_&%.cy.ts')
  })
})
