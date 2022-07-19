top.count = top.count || 0

// @see https://github.com/cypress-io/cypress/issues/17805
describe('recreates session on spec reload in open mode', () => {
  it('sets session', () => {
    let validateFlag = false

    cy.session('persist_session', () => {
      validateFlag = true
    },
    {
      validate () {
        if (validateFlag) {
          return true
        }

        return false
      },
    })

    if (!top.count) {
      return cy.wrap(null).should(() => {
        expect(cy.$$('.commands-container li.command:first', top.document).text()).contain('CREATED')
        top.count++

        // this simulates interactive/open mode
        // so that the run does not complete until after reload
        Cypress.config().isTextTerminal = false
        Cypress.config().isInteractive = true

        // this simulates user clicking the stop and reload button
        // in the browser reporter gui
        cy.$$('button.stop', top.document)[0].click()
        cy.$$('button.restart', top.document)[0].click()
      })
    }

    cy.wrap(null).should(() => {
      expect(cy.$$('.commands-container li.command:first', top.document).text()).contain('RECREATED')
    })
  })
})
