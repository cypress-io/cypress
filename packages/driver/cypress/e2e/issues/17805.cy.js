top.count = top.count || 0

// @see https://github.com/cypress-io/cypress/issues/17805
describe('issue 17805', { experimentalSessionAndOrigin: true }, () => {
  it('recreates session on spec reload in open mode', () => {
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
        expect(cy.$$('.commands-container li.command:first', top.document).text()).contain('created')
        top.count++

        // this simulates interactive/open mode
        // so that the run does not complete until after reload
        Cypress.config().isTextTerminal = false
        Cypress.config().isInteractive = true

        top.location.reload()
      })
    }

    cy.wrap(null).should(() => {
      expect(cy.$$('.commands-container li.command:first', top.document).text()).contain('recreated')
    })
  })
})
