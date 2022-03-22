import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'
import { getPathForPlatform } from '../../../src/paths'

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
        .should('have.length', 4)
        .should('contain', 'blank-contents.spec.js')
        .should('contain', 'dom-container.spec.js')
        .should('contain', 'dom-content.spec.js')
        .should('contain', 'dom-list.spec.js')

        cy.withCtx(async (ctx, o) => {
          await ctx.actions.file.writeFileInProject(o.path, '')
        }, { path: getPathForPlatform('cypress/e2e/new-file.spec.js') })

        cy.get('[data-cy="spec-item-link"]')
        .should('have.length', 5)
        .should('contain', 'blank-contents.spec.js')
        .should('contain', 'dom-container.spec.js')
        .should('contain', 'dom-content.spec.js')
        .should('contain', 'dom-list.spec.js')
        .should('contain', 'new-file.spec.js')
      })

      it('responds to specChange event for a removed file', () => {
        cy.get('[data-cy="spec-item-link"]')
        .should('have.length', 4)
        .should('contain', 'blank-contents.spec.js')
        .should('contain', 'dom-container.spec.js')
        .should('contain', 'dom-content.spec.js')
        .should('contain', 'dom-list.spec.js')

        cy.withCtx(async (ctx, o) => {
          await ctx.actions.file.removeFileInProject(o.path)
        }, { path: getPathForPlatform('cypress/e2e/dom-list.spec.js') })

        cy.get('[data-cy="spec-item-link"]')
        .should('have.length', 3)
        .should('contain', 'blank-contents.spec.js')
        .should('contain', 'dom-container.spec.js')
        .should('contain', 'dom-content.spec.js')
      })

      it('handles adding the first file', () => {
        cy.withCtx(async (ctx, o) => {
          await Promise.all(o.paths.map((path) => ctx.actions.file.removeFileInProject(path)))
        }, {
          paths: [
            getPathForPlatform('cypress/e2e/blank-contents.spec.js'),
            getPathForPlatform('cypress/e2e/dom-container.spec.js'),
            getPathForPlatform('cypress/e2e/dom-content.spec.js'),
            getPathForPlatform('cypress/e2e/dom-list.spec.js'),
          ],
        })

        cy.get('[data-cy="create-spec-page-title"]')
        .should('contain', defaultMessages.createSpec.page.customPatternNoSpecs.title)

        cy.withCtx(async (ctx, o) => {
          await ctx.actions.file.writeFileInProject(o.path, '')
        }, { path: getPathForPlatform('cypress/e2e/new-file.spec.js') })

        cy.get('[data-cy="spec-item-link"]')
        .should('have.length', 1)
        .should('contain', 'new-file.spec.js')
      })

      it('handles removing the last file', () => {
        cy.withCtx(async (ctx, o) => {
          await Promise.all(o.paths.map((path) => ctx.actions.file.removeFileInProject(path)))
        }, {
          paths: [
            getPathForPlatform('cypress/e2e/blank-contents.spec.js'),
            getPathForPlatform('cypress/e2e/dom-container.spec.js'),
            getPathForPlatform('cypress/e2e/dom-content.spec.js'),
          ],
        })

        cy.get('[data-cy="spec-item-link"]')
        .should('have.length', 1)
        .should('contain', 'dom-list.spec.js')

        cy.withCtx(async (ctx, o) => {
          await ctx.actions.file.removeFileInProject(o.path)
        }, { path: getPathForPlatform('cypress/e2e/dom-list.spec.js') })

        cy.get('[data-cy="create-spec-page-title"]')
        .should('contain', defaultMessages.createSpec.page.customPatternNoSpecs.title)
      })

      it('responds to a cypress.config.js file change', () => {
        cy.get('[data-cy="spec-item-link"]')
        .should('have.length', 4)
        .should('contain', 'blank-contents.spec.js')
        .should('contain', 'dom-container.spec.js')
        .should('contain', 'dom-content.spec.js')
        .should('contain', 'dom-list.spec.js')

        cy.withCtx(async (ctx) => {
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
        })

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
        .should('have.length', 4)
        .should('contain', 'blank-contents.spec.js')
        .should('contain', 'dom-container.spec.js')
        .should('contain', 'dom-content.spec.js')
        .should('contain', 'dom-list.spec.js')

        cy.withCtx(async (ctx, o) => {
          await ctx.actions.file.writeFileInProject(o.path, '')
        }, { path: getPathForPlatform('cypress/e2e/new-file.spec.js') })

        cy.get('[data-testid="spec-file-item"]')
        .should('have.length', 5)
        .should('contain', 'blank-contents.spec.js')
        .should('contain', 'dom-container.spec.js')
        .should('contain', 'dom-content.spec.js')
        .should('contain', 'dom-list.spec.js')
        .should('contain', 'new-file.spec.js')
      })

      it('responds to specChange event for a removed file', () => {
        cy.contains('dom-content.spec').click()
        cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')

        cy.get('[data-testid="spec-file-item"]')
        .should('have.length', 4)
        .should('contain', 'blank-contents.spec.js')
        .should('contain', 'dom-container.spec.js')
        .should('contain', 'dom-content.spec.js')
        .should('contain', 'dom-list.spec.js')

        cy.withCtx(async (ctx, o) => {
          await ctx.actions.file.removeFileInProject(o.path)
        }, { path: getPathForPlatform('cypress/e2e/dom-list.spec.js') })

        cy.get('[data-testid="spec-file-item"]')
        .should('have.length', 3)
        .should('contain', 'blank-contents.spec.js')
        .should('contain', 'dom-container.spec.js')
        .should('contain', 'dom-content.spec.js')
      })

      it('handles removing the last file', () => {
        cy.contains('dom-content.spec').click()
        cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')

        cy.withCtx(async (ctx, o) => {
          await Promise.all(o.paths.map((path) => ctx.actions.file.removeFileInProject(path)))
        }, {
          paths: [
            getPathForPlatform('cypress/e2e/blank-contents.spec.js'),
            getPathForPlatform('cypress/e2e/dom-container.spec.js'),
            getPathForPlatform('cypress/e2e/dom-list.spec.js'),
          ],
        })

        cy.get('[data-testid="spec-file-item"]')
        .should('have.length', 1)
        .should('contain', 'dom-content.spec.js')

        cy.withCtx(async (ctx, o) => {
          await ctx.actions.file.removeFileInProject(o.path)
        }, { path: getPathForPlatform('cypress/e2e/dom-content.spec.js') })

        cy.get('[data-cy="create-spec-page-title"]')
        .should('contain', defaultMessages.createSpec.page.customPatternNoSpecs.title)
      })

      it('responds to a cypress.config.js file change', () => {
        cy.contains('dom-content.spec').click()
        cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')

        cy.get('[data-testid="spec-file-item"]')
        .should('have.length', 4)
        .should('contain', 'blank-contents.spec.js')
        .should('contain', 'dom-container.spec.js')
        .should('contain', 'dom-content.spec.js')
        .should('contain', 'dom-list.spec.js')

        cy.withCtx(async (ctx) => {
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
        })

        cy.get('[data-testid="spec-file-item"]')
        .should('have.length', 2)
        .should('contain', 'dom-container.spec.js')
        .should('contain', 'dom-content.spec.js')
      })
    })

    describe('spec pattern modal', () => {
      it('responds to specChange event for an added file', () => {
        cy.contains('button', 'View spec pattern').click()

        cy.get('[data-cy="spec-pattern-modal"]').should('be.visible')
        cy.get('[data-cy="spec-pattern"]').contains('cypress/e2e/**/*.spec.{js,ts}')

        cy.get('[data-cy="file-match-indicator"]')
        .should('contain', '4 Matches')

        cy.withCtx(async (ctx, o) => {
          await ctx.actions.file.writeFileInProject(o.path, '')
        }, { path: getPathForPlatform('cypress/e2e/new-file.spec.js') })

        cy.get('[data-cy="file-match-indicator"]')
        .should('contain', '5 Matches')
      })

      it('responds to specChange event for a removed file', () => {
        cy.contains('button', 'View spec pattern').click()

        cy.get('[data-cy="spec-pattern-modal"]').should('be.visible')
        cy.get('[data-cy="spec-pattern"]').contains('cypress/e2e/**/*.spec.{js,ts}')

        cy.get('[data-cy="file-match-indicator"]')
        .should('contain', '4 Matches')

        cy.withCtx(async (ctx, o) => {
          await ctx.actions.file.removeFileInProject(o.path)
        }, { path: getPathForPlatform('cypress/e2e/dom-list.spec.js') })

        cy.get('[data-cy="file-match-indicator"]')
        .should('contain', '3 Matches')
      })

      it('handles removing the last file', () => {
        cy.contains('button', 'View spec pattern').click()

        cy.get('[data-cy="spec-pattern-modal"]').should('be.visible')
        cy.get('[data-cy="spec-pattern"]').contains('cypress/e2e/**/*.spec.{js,ts}')

        cy.withCtx(async (ctx, o) => {
          await Promise.all(o.paths.map((path) => ctx.actions.file.removeFileInProject(path)))
        }, {
          paths: [
            getPathForPlatform('cypress/e2e/blank-contents.spec.js'),
            getPathForPlatform('cypress/e2e/dom-container.spec.js'),
            getPathForPlatform('cypress/e2e/dom-content.spec.js'),
          ],
        })

        cy.get('[data-cy="file-match-indicator"]')
        .should('contain', '1 Match')

        cy.withCtx(async (ctx, o) => {
          await ctx.actions.file.removeFileInProject(o.path)
        }, { path: getPathForPlatform('cypress/e2e/dom-list.spec.js') })

        cy.get('[data-cy="create-spec-page-title"]')
        .should('contain', defaultMessages.createSpec.page.customPatternNoSpecs.title)
      })

      it('responds to a cypress.config.js file change', () => {
        cy.contains('button', 'View spec pattern').click()

        cy.get('[data-cy="spec-pattern-modal"]').should('be.visible')
        cy.get('[data-cy="spec-pattern"]').contains('cypress/e2e/**/*.spec.{js,ts}')

        cy.get('[data-cy="file-match-indicator"]')
        .should('contain', '4 Matches')

        cy.withCtx(async (ctx) => {
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
        })

        cy.get('[data-cy="file-match-indicator"]')
        .should('contain', '2 Matches')
      })
    })
  })
})
