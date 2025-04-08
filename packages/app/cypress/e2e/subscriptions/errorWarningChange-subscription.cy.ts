describe('errorWarningChange subscription', () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
  })

  function assertLoadingIntoErrorWorks (errorName: string) {
    cy.contains('h2', errorName).should('be.visible')
    cy.contains('[role="alert"]', 'Loading').should('not.exist')
  }

  describe('in app', () => {
    beforeEach(() => {
      cy.startAppServer()
      cy.visitApp()
      cy.specsPageIsVisible()
    })

    describe('when the config file is saved with errors', () => {
      it('shows an error for wrong property value', () => {
        cy.contains('Error').should('not.exist')
        cy.withCtx(async (ctx) => {
          await ctx.actions.file.writeFileInProject('cypress.config.js',
`   
module.exports = {
  projectId: 'abc123',
  component: {
    viewportHeight: '20',
  }
}`)
        })

        assertLoadingIntoErrorWorks('Error')
        cy.contains('Expected component.viewportHeight to be a number.').should('be.visible')
        cy.withCtx(async (ctx) => {
          await ctx.actions.file.writeFileInProject('cypress.config.js',
`   
module.exports = {
  projectId: 'abc123',
  component: {
    viewportHeight: 20,
  }
}`)
        })

        cy.contains(cy.i18n.launchpadErrors.generic.retryButton).click()
        cy.contains('Error').should('not.exist')
      })

      it('shows expected error for malformed config file', () => {
        cy.contains('h2', 'SyntaxError').should('not.exist')
        cy.withCtx(async (ctx) => {
          await ctx.actions.file.writeFileInProject('cypress.config.js',
`   
module.exports = {
  projectId: 'abc123',
  component: {
    viewportHeight: ,
  }
}`)
        })

        assertLoadingIntoErrorWorks('SyntaxError')
        cy.contains('Your configFile is invalid').should('be.visible')
        cy.contains('Unexpected token \',\'').scrollIntoView().should('be.visible')
        cy.withCtx(async (ctx) => {
          await ctx.actions.file.writeFileInProject('cypress.config.js',
`   
module.exports = {
  projectId: 'abc123',
  component: {
    viewportHeight: 20,
  }
}`)
        })

        cy.contains(cy.i18n.launchpadErrors.generic.retryButton).click()
        cy.contains('h2', 'SyntaxError').should('not.exist')
      })
    })
  })
})
