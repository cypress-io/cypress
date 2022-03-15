function getPathForPlatform (posixPath: string) {
  if (Cypress.platform === 'win32') return posixPath.replaceAll('/', '\\')

  return posixPath
}

describe('specChange subscription', () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
  })

  describe('in app', () => {
    beforeEach(() => {
      cy.startAppServer()
      cy.visitApp()
    })

    describe('specs list', () => {
      it('responds to specChange event for an added file', () => {
        cy.get('[data-cy="spec-item-link"]')
        .should('have.length', 3)
        .should('contain', 'dom-container.spec.js')
        .should('contain', 'dom-content.spec.js')
        .should('contain', 'dom-list.spec.js')

        cy.withCtx(async (ctx, o) => {
          await ctx.actions.file.writeFileInProject(o.path, '')
        }, { path: getPathForPlatform('cypress/e2e/new-file.spec.js') })

        cy.get('[data-cy="spec-item-link"]')
        .should('have.length', 4)
        .should('contain', 'dom-container.spec.js')
        .should('contain', 'dom-content.spec.js')
        .should('contain', 'dom-list.spec.js')
        .should('contain', 'new-file.spec.js')
      })

      it('responds to specChange event for a removed file', () => {
        cy.get('[data-cy="spec-item-link"]')
        .should('have.length', 3)
        .should('contain', 'dom-container.spec.js')
        .should('contain', 'dom-content.spec.js')
        .should('contain', 'dom-list.spec.js')

        cy.withCtx(async (ctx, o) => {
          await ctx.actions.file.removeFileInProject(o.path)
        }, { path: getPathForPlatform('cypress/e2e/dom-list.spec.js') })

        cy.get('[data-cy="spec-item-link"]')
        .should('have.length', 2)
        .should('contain', 'dom-container.spec.js')
        .should('contain', 'dom-content.spec.js')
      })

      it('responds to a cypress.config.js file change', () => {
        cy.get('[data-cy="spec-item-link"]')
        .should('have.length', 3)
        .should('contain', 'dom-container.spec.js')
        .should('contain', 'dom-content.spec.js')
        .should('contain', 'dom-list.spec.js')

        cy.withCtx(async (ctx, o) => {
          await ctx.actions.file.writeFileInProject('cypress.config.js',
`const { devServer } = require('@cypress/react/plugins/load-webpack')
    
module.exports = {
  projectId: 'abc123',
  experimentalInteractiveRunEvents: true,
  component: {
    specPattern: 'src/**/*.{spec,cy}.{js,ts,tsx,jsx}',
    supportFile: false,
    devServer,
    devServerConfig: {
      webpackFilename: 'webpack.config.js',
    },
  },
  e2e: {
    specPattern: 'cypress/e2e/**/dom-cont*.spec.{js,ts}',
    supportFile: false,
  },
}`)
        }, { path: getPathForPlatform('cypress/e2e/dom-list.spec.js') })

        cy.get('[data-cy="spec-item-link"]')
        .should('have.length', 2)
        .should('contain', 'dom-container.spec.js')
        .should('contain', 'dom-content.spec.js')
      })
    })

    describe('inline specs list', () => {
      it('responds to specChange event for an added file', () => {
        cy.contains('dom-content.spec').click()
        cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')

        cy.get('[data-testid="spec-file-item"]')
        .should('have.length', 3)
        .should('contain', 'dom-container.spec.js')
        .should('contain', 'dom-content.spec.js')
        .should('contain', 'dom-list.spec.js')

        cy.withCtx(async (ctx, o) => {
          await ctx.actions.file.writeFileInProject(o.path, '')
        }, { path: getPathForPlatform('cypress/e2e/new-file.spec.js') })

        cy.get('[data-testid="spec-file-item"]')
        .should('have.length', 4)
        .should('contain', 'dom-container.spec.js')
        .should('contain', 'dom-content.spec.js')
        .should('contain', 'dom-list.spec.js')
        .should('contain', 'new-file.spec.js')
      })

      it('responds to specChange event for a removed file', () => {
        cy.contains('dom-content.spec').click()
        cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')

        cy.get('[data-testid="spec-file-item"]')
        .should('have.length', 3)
        .should('contain', 'dom-container.spec.js')
        .should('contain', 'dom-content.spec.js')
        .should('contain', 'dom-list.spec.js')

        cy.withCtx(async (ctx, o) => {
          await ctx.actions.file.removeFileInProject(o.path)
        }, { path: getPathForPlatform('cypress/e2e/dom-list.spec.js') })

        cy.get('[data-testid="spec-file-item"]')
        .should('have.length', 2)
        .should('contain', 'dom-container.spec.js')
        .should('contain', 'dom-content.spec.js')
      })

      it('responds to a cypress.config.js file change', () => {
        cy.contains('dom-content.spec').click()
        cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')

        cy.get('[data-testid="spec-file-item"]')
        .should('have.length', 3)
        .should('contain', 'dom-container.spec.js')
        .should('contain', 'dom-content.spec.js')
        .should('contain', 'dom-list.spec.js')

        cy.withCtx(async (ctx, o) => {
          await ctx.actions.file.writeFileInProject('cypress.config.js',
`const { devServer } = require('@cypress/react/plugins/load-webpack')
    
module.exports = {
  projectId: 'abc123',
  experimentalInteractiveRunEvents: true,
  component: {
    specPattern: 'src/**/*.{spec,cy}.{js,ts,tsx,jsx}',
    supportFile: false,
    devServer,
    devServerConfig: {
      webpackFilename: 'webpack.config.js',
    },
  },
  e2e: {
    specPattern: 'cypress/e2e/**/dom-cont*.spec.{js,ts}',
    supportFile: false,
  },
}`)
        }, { path: getPathForPlatform('cypress/e2e/dom-list.spec.js') })

        cy.get('[data-testid="spec-file-item"]')
        .should('have.length', 2)
        .should('contain', 'dom-container.spec.js')
        .should('contain', 'dom-content.spec.js')
      })
    })
  })
})
