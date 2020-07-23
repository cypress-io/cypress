describe('5681', () => {
  let error = new ReferenceError('notExistingFunction is not defined')

  before((done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.eql(error.message)
      expect(err.name).to.eql(error.name)

      done()
    })

    // generate a syntax error
    // eslint-disable-next-line
    notExistingFunction()
  })

  after(() => {
    cy.get('.action-email').type('fake@email.com')
  })

  it('green test', () => {
    cy.visit('https://example.cypress.io/commands/actions')
  })
})
