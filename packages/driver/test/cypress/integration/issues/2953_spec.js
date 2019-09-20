// https://github.com/cypress-io/cypress/issues/2953
describe('Issue 2953: Improper arguments for cy.get()', () => {

  it('calls cy get with 2 strings', () => {
    cy.on('fail', (err) => {
      expect(err.message).to.include('expected bar to be of type object, instead got string')
    })

    // TypeError: Cannot read property 'set' of undefined
    cy.get('input', 'bar')
  })

  it('calls cy get with string and number', () => {
    // TypeError: Cannot read property 'set' of undefined
    cy.on('fail', (err) => {
      expect(err.message).to.include('expected 42 to be of type object, instead got number')
    })

    cy.get('input', 42)
  })
})
