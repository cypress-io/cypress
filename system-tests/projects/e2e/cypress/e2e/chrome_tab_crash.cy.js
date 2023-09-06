describe('a test suite with a browser crash', function () {
  // let deferred; let proceed

  before(() => {
    // deferred = new Promise((res) => proceed = res)
  })

  it('navigates to about:blank', () => {
    cy.visit('/index.html').then(() => {
      //   proceed()
    })
  })

  it('crashes the chrome tab', () => {
    // make exec of this one dependent on prev, to ensure linear execution of tests for predictable results
  //  cy.wrap(deferred).then((() => {
    Cypress.automation('remote:debugger:protocol', { command: 'Page.navigate', params: { url: 'chrome://crash', transitionType: 'typed' } })

    cy.visit('localhost')
    //   }))
  })
})
