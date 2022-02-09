// https://github.com/cypress-io/cypress/issues/5475
describe('issue #5475', () => {
  it('hangs on next spec after modifying history.pushState', () => {
    cy.visit('/index.html')

    cy.window().then((win) => {
      win.history.pushState({}, null, `/`)
    })

    cy.go('back')
  })
})
