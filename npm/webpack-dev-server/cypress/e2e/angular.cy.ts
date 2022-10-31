// <reference types="cypress" />
/// <reference path="../support/e2e.ts" />
import type { ProjectFixtureDir } from '@tooling/system-tests/lib/fixtureDirs'

const WEBPACK_REACT: ProjectFixtureDir[] = ['angular-13', 'angular-14', 'angular-15']

// Add to this list to focus on a particular permutation
const ONLY_PROJECTS: ProjectFixtureDir[] = []

for (const project of WEBPACK_REACT) {
  if (ONLY_PROJECTS.length && !ONLY_PROJECTS.includes(project)) {
    continue
  }

  describe(`Working with ${project}`, () => {
    beforeEach(() => {
      cy.scaffoldProject(project)
      cy.openProject(project)
      cy.startAppServer('component')
    })

    it('should mount a passing test', () => {
      cy.visitApp()
      cy.contains('app.component.cy.ts').click()
      cy.waitForSpecToFinish({ passCount: 1 }, 60000)

      cy.get('li.command').first().within(() => {
        cy.get('.command-method').should('contain', 'mount')
        cy.get('.command-message').should('contain', 'AppComponent')
      })
    })

    it('should live-reload on src changes', () => {
      cy.visitApp()
      cy.contains('app.component.cy.ts').click()
      cy.waitForSpecToFinish({ passCount: 1 }, 60000)

      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject(
          ctx.path.join('src', 'app', 'app.component.html'),
          (await ctx.file.readFileInProject(ctx.path.join('src', 'app', 'app.component.html'))).replace('Hello World', 'Hello Cypress'),
        )
      })

      cy.waitForSpecToFinish({ failCount: 1 }, 60000)

      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject(
          ctx.path.join('src', 'app', 'app.component.html'),
          (await ctx.file.readFileInProject(ctx.path.join('src', 'app', 'app.component.html'))).replace('Hello Cypress', 'Hello World'),
        )
      })

      cy.waitForSpecToFinish({ passCount: 1 }, 60000)
    })

    it('should show compilation errors on src changes', () => {
      cy.visitApp()

      cy.contains('app.component.cy.ts').click()
      cy.waitForSpecToFinish({ passCount: 1 }, 60000)

      // Create compilation error
      cy.withCtx(async (ctx) => {
        const componentFilePath = ctx.path.join('src', 'app', 'app.component.ts')

        await ctx.actions.file.writeFileInProject(
          componentFilePath,
          (await ctx.file.readFileInProject(componentFilePath)).replace('class', 'classaaaaa'),
        )
      })

      // The test should fail and the stack trace should appear in the command log
      cy.waitForSpecToFinish({ failCount: 1 }, 60000)
      cy.contains('The following error originated from your test code, not from Cypress.').should('exist')
      cy.get('.test-err-code-frame').should('be.visible')
    })

    // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23455
    it.skip('should detect new spec', () => {
      cy.visitApp()

      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject(
          ctx.path.join('src', 'app', 'new.component.cy.ts'),
          await ctx.file.readFileInProject(ctx.path.join('src', 'app', 'app.component.cy.ts')),
        )
      })

      cy.contains('new.component.cy.ts').click()
      cy.waitForSpecToFinish({ passCount: 1 }, 60000)
    })
  })
}
