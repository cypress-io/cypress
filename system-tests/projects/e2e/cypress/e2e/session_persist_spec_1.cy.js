top.count = top.count || 0

describe('persist saved sessions between spec reruns', () => {
  it('sets session', () => {
    cy.session('persist_session', () => {
      cy.setCookie('cookieName', 'cookieValue')
    })

    if (!top.count) {
      return cy.wrap(null).should(() => {
        expect(cy.$$('.commands-container li.command:first', top.document).text()).contain('(new)')
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

    cy.$$('.runnable-active', top.document)[0].click()

    cy.wrap(null).should(() => {
      expect(cy.$$('.commands-container li.command:first', top.document).text()).contain('(saved)')
    })
  })
})
