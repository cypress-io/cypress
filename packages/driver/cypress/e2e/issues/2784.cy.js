// https://github.com/cypress-io/cypress/issues/2784
describe('issue #2784', () => {
  it('does not throw when embedding a cross origin iframe', () => {
    cy.visit('/fixtures/generic.html')
    cy.document().then((doc) => {
      return new Cypress.Promise((resolve) => {
        const iframe = doc.createElement('iframe')

        iframe.onload = resolve
        iframe.src = 'http://localhost:3501/fixtures/generic.html'
        doc.body.appendChild(iframe)
      })
    })

    // change the subject to be <window>
    cy.window()
    cy.get('a').should('be.visible')
  })
})
