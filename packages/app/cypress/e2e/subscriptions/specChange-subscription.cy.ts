import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'
import { getPathForPlatform } from '../../../src/paths'

describe('specChange subscription', () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
    cy.startAppServer()
    cy.visitApp()
    cy.specsPageIsVisible()
  })

  describe('specs list', () => {
    it('responds to specChange event for an added file', () => {
      cy.get('[data-cy="spec-item-link"]')
      // cannot assert a length since this is a virtualized list
      // .should('have.length', 14)
      .should('contain', 'blank-contents.spec.js')
      .should('contain', 'dom-container.spec.js')
      .should('contain', 'dom-content.spec.js')
      .should('contain', 'dom-list.spec.js')

      cy.withCtx(async (ctx, o) => {
        await ctx.actions.file.writeFileInProject(o.path, '')
      }, { path: getPathForPlatform('cypress/e2e/new-file.spec.js') })

      cy.get('[data-cy="spec-item-link"]')
      // cannot assert a length since this is a virtualized list
      // .should('have.length', 15)
      .should('contain', 'blank-contents.spec.js')
      .should('contain', 'dom-container.spec.js')
      .should('contain', 'dom-content.spec.js')
      .should('contain', 'dom-list.spec.js')
      .should('contain', 'new-file.spec.js')
    })

    it('responds to specChange event for a removed file', () => {
      cy.get('[data-cy="spec-item-link"]')
      // cannot assert a length since this is a virtualized list
      // .should('have.length', 14)
      .should('contain', 'blank-contents.spec.js')
      .should('contain', 'dom-container.spec.js')
      .should('contain', 'dom-content.spec.js')
      .should('contain', 'dom-list.spec.js')

      cy.withCtx(async (ctx, o) => {
        await ctx.actions.file.removeFileInProject(o.path)
      }, { path: getPathForPlatform('cypress/e2e/dom-list.spec.js') })

      cy.get('[data-cy="spec-item-link"]')
      // cannot assert a length since this is a virtualized list
      // .should('have.length', 13)
      .should('contain', 'blank-contents.spec.js')
      .should('contain', 'dom-container.spec.js')
      .should('contain', 'dom-content.spec.js')
      .should('not.contain', 'dom-list.spec.js')
    })

    it('handles adding the first file', () => {
      cy.withCtx(async (ctx, o) => {
        await Promise.all(o.paths.map((path) => ctx.actions.file.removeFileInProject(path)))
      }, {
        paths: [
          getPathForPlatform('cypress/e2e/blank-contents.spec.js'),
          getPathForPlatform('cypress/e2e/dom-container.spec.js'),
          getPathForPlatform('cypress/e2e/dom-content.spec.js'),
          getPathForPlatform('cypress/e2e/dom-content-scrollable-commands.spec.js'),
          getPathForPlatform('cypress/e2e/dom-list.spec.js'),
          getPathForPlatform('cypress/e2e/withFailure.spec.js'),
          getPathForPlatform('cypress/e2e/withWait.spec.js'),
          getPathForPlatform('cypress/e2e/123.spec.js'),
          getPathForPlatform('cypress/e2e/app.spec.js'),
          getPathForPlatform('cypress/e2e/柏树很棒.spec.js'),
          getPathForPlatform('cypress/e2e/a-b_c/d~e(f)g.spec.js'),
          getPathForPlatform('cypress/e2e/accounts/accounts_list.spec.js'),
          getPathForPlatform('cypress/e2e/accounts/accounts_new.spec.js'),
          getPathForPlatform('cypress/e2e/admin_users/admin_users_list.spec.js'),
          getPathForPlatform('cypress/e2e/admin_users/admin.user/foo_list.spec.js'),
          getPathForPlatform('cypress/e2e/test-isolation.spec.js'),
          getPathForPlatform('cypress/e2e/test-isolation-describe-config.spec.js'),
          getPathForPlatform('cypress/e2e/z001.spec.js'),
          getPathForPlatform('cypress/e2e/z002.spec.js'),
          getPathForPlatform('cypress/e2e/z003.spec.js'),
          getPathForPlatform('cypress/e2e/z004.spec.js'),
          getPathForPlatform('cypress/e2e/z005.spec.js'),
          getPathForPlatform('cypress/e2e/z006.spec.js'),
          getPathForPlatform('cypress/e2e/z007.spec.js'),
          getPathForPlatform('cypress/e2e/z008.spec.js'),
          getPathForPlatform('cypress/e2e/z009.spec.js'),
          getPathForPlatform('cypress/e2e/dummyTest4276_test.spec.js'),
          getPathForPlatform('cypress/e2e/dummy7890Test_test.spec.js'),
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
          getPathForPlatform('cypress/e2e/dom-content-scrollable-commands.spec.js'),
          getPathForPlatform('cypress/e2e/withFailure.spec.js'),
          getPathForPlatform('cypress/e2e/withWait.spec.js'),
          getPathForPlatform('cypress/e2e/123.spec.js'),
          getPathForPlatform('cypress/e2e/app.spec.js'),
          getPathForPlatform('cypress/e2e/柏树很棒.spec.js'),
          getPathForPlatform('cypress/e2e/a-b_c/d~e(f)g.spec.js'),
          getPathForPlatform('cypress/e2e/accounts/accounts_list.spec.js'),
          getPathForPlatform('cypress/e2e/accounts/accounts_new.spec.js'),
          getPathForPlatform('cypress/e2e/admin_users/admin_users_list.spec.js'),
          getPathForPlatform('cypress/e2e/admin_users/admin.user/foo_list.spec.js'),
          getPathForPlatform('cypress/e2e/test-isolation.spec.js'),
          getPathForPlatform('cypress/e2e/test-isolation-describe-config.spec.js'),
          getPathForPlatform('cypress/e2e/z001.spec.js'),
          getPathForPlatform('cypress/e2e/z002.spec.js'),
          getPathForPlatform('cypress/e2e/z003.spec.js'),
          getPathForPlatform('cypress/e2e/z004.spec.js'),
          getPathForPlatform('cypress/e2e/z005.spec.js'),
          getPathForPlatform('cypress/e2e/z006.spec.js'),
          getPathForPlatform('cypress/e2e/z007.spec.js'),
          getPathForPlatform('cypress/e2e/z008.spec.js'),
          getPathForPlatform('cypress/e2e/z009.spec.js'),
          getPathForPlatform('cypress/e2e/dummyTest4276_test.spec.js'),
          getPathForPlatform('cypress/e2e/dummy7890Test_test.spec.js'),
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
      // cannot assert a length since this is a virtualized list
      // .should('have.length', 14)
      .should('contain', 'blank-contents.spec.js')
      .should('contain', 'dom-container.spec.js')
      .should('contain', 'dom-content.spec.js')
      .should('contain', 'dom-list.spec.js')

      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject('cypress.config.js',
`   
module.exports = {
projectId: 'abc123',
experimentalInteractiveRunEvents: true,
component: {
  specPattern: 'src/**/*.{spec,cy}.{js,jsx,ts,tsx}',
  supportFile: false,
  devServer: {
    framework: 'react',
    bundler: 'webpack',
  }
},
e2e: {
  specPattern: 'cypress/e2e/**/dom-cont*.spec.{js,ts}',
  supportFile: false,
},
}`)
      })

      cy.get('[data-cy="spec-item-link"]', { timeout: 7500 })
      .should('have.length', 3)
      .should('contain', 'dom-container.spec.js')
      .should('contain', 'dom-content.spec.js')
      .should('contain', 'dom-content-scrollable-commands.spec.js')
    })
  })

  describe('inline specs list', () => {
    it('responds to specChange event for an added file', () => {
      cy.contains('dom-content.spec').click()
      cy.waitForSpecToFinish()
      cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')

      cy.get('body').type('f')
      cy.get('[data-cy="spec-file-item"]')
      .should('have.length', 28)
      .should('contain', 'blank-contents.spec.js')
      .should('contain', 'dom-container.spec.js')
      .should('contain', 'dom-content.spec.js')
      .should('contain', 'dom-list.spec.js')

      cy.withCtx(async (ctx, o) => {
        await ctx.actions.file.writeFileInProject(o.path, '')
      }, { path: getPathForPlatform('cypress/e2e/new-file.spec.js') })

      cy.get('[data-cy="spec-file-item"]')
      .should('have.length', 29)
      .should('contain', 'blank-contents.spec.js')
      .should('contain', 'dom-container.spec.js')
      .should('contain', 'dom-content.spec.js')
      .should('contain', 'dom-list.spec.js')
      .should('contain', 'new-file.spec.js')
    })

    it('responds to specChange event for a removed file', () => {
      cy.contains('dom-content.spec').click()
      cy.waitForSpecToFinish()
      cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')

      cy.get('body').type('f')
      cy.get('[data-cy="spec-file-item"]')
      .should('have.length', 28)
      .should('contain', 'blank-contents.spec.js')
      .should('contain', 'dom-container.spec.js')
      .should('contain', 'dom-content.spec.js')
      .should('contain', 'dom-list.spec.js')

      cy.withCtx(async (ctx, o) => {
        await ctx.actions.file.removeFileInProject(o.path)
      }, { path: getPathForPlatform('cypress/e2e/dom-list.spec.js') })

      cy.get('[data-cy="spec-file-item"]')
      .should('have.length', 27)
      .should('contain', 'blank-contents.spec.js')
      .should('contain', 'dom-container.spec.js')
      .should('contain', 'dom-content.spec.js')
    })

    it('handles removing the last file', () => {
      cy.contains('dom-content.spec').click()
      cy.get('button[aria-controls="reporter-inline-specs-list"]').click({ force: true })
      cy.get('[data-cy=specs-list-panel]').should('be.visible')
      cy.waitForSpecToFinish()
      cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')
      cy.withCtx(async (ctx, o) => {
        await Promise.all(o.paths.map((path) => ctx.actions.file.removeFileInProject(path)))
      }, {
        paths: [
          getPathForPlatform('cypress/e2e/blank-contents.spec.js'),
          getPathForPlatform('cypress/e2e/dom-container.spec.js'),
          getPathForPlatform('cypress/e2e/dom-list.spec.js'),
          getPathForPlatform('cypress/e2e/dom-content-scrollable-commands.spec.js'),
          getPathForPlatform('cypress/e2e/withFailure.spec.js'),
          getPathForPlatform('cypress/e2e/withWait.spec.js'),
          getPathForPlatform('cypress/e2e/123.spec.js'),
          getPathForPlatform('cypress/e2e/app.spec.js'),
          getPathForPlatform('cypress/e2e/柏树很棒.spec.js'),
          getPathForPlatform('cypress/e2e/a-b_c/d~e(f)g.spec.js'),
          getPathForPlatform('cypress/e2e/accounts/accounts_list.spec.js'),
          getPathForPlatform('cypress/e2e/accounts/accounts_new.spec.js'),
          getPathForPlatform('cypress/e2e/admin_users/admin_users_list.spec.js'),
          getPathForPlatform('cypress/e2e/admin_users/admin.user/foo_list.spec.js'),
          getPathForPlatform('cypress/e2e/test-isolation.spec.js'),
          getPathForPlatform('cypress/e2e/test-isolation-describe-config.spec.js'),
          getPathForPlatform('cypress/e2e/z001.spec.js'),
          getPathForPlatform('cypress/e2e/z002.spec.js'),
          getPathForPlatform('cypress/e2e/z003.spec.js'),
          getPathForPlatform('cypress/e2e/z004.spec.js'),
          getPathForPlatform('cypress/e2e/z005.spec.js'),
          getPathForPlatform('cypress/e2e/z006.spec.js'),
          getPathForPlatform('cypress/e2e/z007.spec.js'),
          getPathForPlatform('cypress/e2e/z008.spec.js'),
          getPathForPlatform('cypress/e2e/z009.spec.js'),
          getPathForPlatform('cypress/e2e/dummyTest4276_test.spec.js'),
          getPathForPlatform('cypress/e2e/dummy7890Test_test.spec.js'),
        ],
      })

      cy.get('[data-cy="spec-file-item"]')
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
      cy.waitForSpecToFinish()
      cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')

      cy.get('body').type('f')
      cy.get('[data-cy="spec-file-item"]')
      .should('have.length', 28)
      .should('contain', 'blank-contents.spec.js')
      .should('contain', 'dom-container.spec.js')
      .should('contain', 'dom-content.spec.js')
      .should('contain', 'dom-list.spec.js')

      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject('cypress.config.js',
`   
module.exports = {
projectId: 'abc123',
experimentalInteractiveRunEvents: true,
component: {
  specPattern: 'src/**/*.{spec,cy}.{js,jsx,ts,tsx}',
  supportFile: false,
  devServer: {
    framework: 'react',
    bundler: 'webpack',
  }
},
e2e: {
  specPattern: 'cypress/e2e/**/dom-cont*.spec.{js,ts}',
  supportFile: false,
},
}`)
      })

      cy.get('[data-cy="spec-file-item"]', { timeout: 7500 })
      .should('have.length', 3)
      .should('contain', 'dom-container.spec.js')
      .should('contain', 'dom-content.spec.js')
      .should('contain', 'dom-content-scrollable-commands.spec.js')
    })
  })

  describe('spec pattern modal', () => {
    it('responds to specChange event for an added file', () => {
      cy.contains('button', 'View spec pattern').click()

      cy.get('[data-cy="spec-pattern-modal"]').should('be.visible')
      cy.get('[data-cy="spec-pattern"]').contains('cypress/e2e/**/*.spec.{js,ts}')

      cy.get('[data-cy="file-match-indicator"]')
      .should('contain', '28 matches')

      cy.withCtx(async (ctx, o) => {
        await ctx.actions.file.writeFileInProject(o.path, '')
      }, { path: getPathForPlatform('cypress/e2e/new-file.spec.js') })

      cy.get('[data-cy="file-match-indicator"]')
      .should('contain', '29 matches')
    })

    it('responds to specChange event for a removed file', () => {
      cy.contains('button', 'View spec pattern').click()

      cy.get('[data-cy="spec-pattern-modal"]').should('be.visible')
      cy.get('[data-cy="spec-pattern"]').contains('cypress/e2e/**/*.spec.{js,ts}')

      cy.get('[data-cy="file-match-indicator"]')
      .should('contain', '28 matches')

      cy.withCtx(async (ctx, o) => {
        await ctx.actions.file.removeFileInProject(o.path)
      }, { path: getPathForPlatform('cypress/e2e/dom-list.spec.js') })

      cy.get('[data-cy="file-match-indicator"]')
      .should('contain', '27 matches')
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
          getPathForPlatform('cypress/e2e/dom-content-scrollable-commands.spec.js'),
          getPathForPlatform('cypress/e2e/withFailure.spec.js'),
          getPathForPlatform('cypress/e2e/withWait.spec.js'),
          getPathForPlatform('cypress/e2e/123.spec.js'),
          getPathForPlatform('cypress/e2e/app.spec.js'),
          getPathForPlatform('cypress/e2e/柏树很棒.spec.js'),
          getPathForPlatform('cypress/e2e/a-b_c/d~e(f)g.spec.js'),
          getPathForPlatform('cypress/e2e/accounts/accounts_list.spec.js'),
          getPathForPlatform('cypress/e2e/accounts/accounts_new.spec.js'),
          getPathForPlatform('cypress/e2e/admin_users/admin_users_list.spec.js'),
          getPathForPlatform('cypress/e2e/admin_users/admin.user/foo_list.spec.js'),
          getPathForPlatform('cypress/e2e/test-isolation.spec.js'),
          getPathForPlatform('cypress/e2e/test-isolation-describe-config.spec.js'),
          getPathForPlatform('cypress/e2e/z001.spec.js'),
          getPathForPlatform('cypress/e2e/z002.spec.js'),
          getPathForPlatform('cypress/e2e/z003.spec.js'),
          getPathForPlatform('cypress/e2e/z004.spec.js'),
          getPathForPlatform('cypress/e2e/z005.spec.js'),
          getPathForPlatform('cypress/e2e/z006.spec.js'),
          getPathForPlatform('cypress/e2e/z007.spec.js'),
          getPathForPlatform('cypress/e2e/z008.spec.js'),
          getPathForPlatform('cypress/e2e/z009.spec.js'),
          getPathForPlatform('cypress/e2e/dummyTest4276_test.spec.js'),
          getPathForPlatform('cypress/e2e/dummy7890Test_test.spec.js'),
        ],
      })

      cy.get('[data-cy="file-match-indicator"]')
      .should('contain', '1 match')

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
      .should('contain', '28 matches')

      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject('cypress.config.js',
`   
module.exports = {
projectId: 'abc123',
experimentalInteractiveRunEvents: true,
component: {
  specPattern: 'src/**/*.{spec,cy}.{js,jsx,ts,tsx}',
  supportFile: false,
  devServer: {
    framework: 'react',
    bundler: 'webpack',
  }
},
e2e: {
  specPattern: 'cypress/e2e/**/dom-cont*.spec.{js,ts}',
  supportFile: false,
},
}`)
      })

      cy.get('[data-cy="file-match-indicator"]', { timeout: 7500 })
      .should('contain', '3 matches')

      // Regression for https://github.com/cypress-io/cypress/issues/27103
      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject('cypress.config.js',
`   
module.exports = {
  projectId: 'abc123',
  experimentalInteractiveRunEvents: true,
  component: {
    specPattern: 'src/**/*.{spec,cy}.{js,jsx,ts,tsx}',
    supportFile: false,
    devServer: {
      framework: 'react',
      bundler: 'webpack',
    }
  },
  e2e: {
    specPattern: ['cypress/e2e/**/dom-cont*.spec.{js,ts}'],
    supportFile: false,
    setupNodeEvents(on, config) {
      /**
       * This should make Cypress yield a "no specs found" error.
       *
       * This stops being the case if 'specPattern' is an array.
       */
      config.specPattern = [];
      return config;
    },
  },
}`)
      })

      cy.get('[data-cy="create-spec-page-title"]')
      .should('contain', defaultMessages.createSpec.page.customPatternNoSpecs.title)
    })
  })
})
