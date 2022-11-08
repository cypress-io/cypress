/// <reference path="../support/e2e.ts" />
import type { ProjectFixtureDir } from '@tooling/system-tests/lib/fixtureDirs'

const PROJECTS: ProjectFixtureDir[] = ['nuxtjs2']

// Add to this list to focus on a particular permutation
const ONLY_PROJECTS: ProjectFixtureDir[] = []

for (const project of PROJECTS) {
  if (ONLY_PROJECTS.length && !ONLY_PROJECTS.includes(project)) {
    continue
  }

  // TODO: This will work once `cypress/vue2` is bundled in the binary
  // Since Nuxt.js 2 is based on `vue@2`.
  describe(`Working with ${project}`, () => {
    beforeEach(() => {
      cy.scaffoldProject(project)
      cy.openProject(project)
      cy.startAppServer('component')
    })

    it('should mount a passing test and live-reload', () => {
      cy.visitApp()
      cy.contains('Tutorial.cy.js').click()
      cy.waitForSpecToFinish({ passCount: 1 })

      cy.withCtx(async (ctx) => {
        const tutorialVuePath = ctx.path.join('components', 'Tutorial.vue')

        await ctx.actions.file.writeFileInProject(
          tutorialVuePath,
          (await ctx.file.readFileInProject(tutorialVuePath)).replace('Nuxt', 'Tutorial'),
        )
      })

      cy.waitForSpecToFinish({ failCount: 1 })
      cy.get('.test-err-code-frame').should('be.visible')

      cy.withCtx(async (ctx) => {
        const tutorialCyPath = ctx.path.join('components', 'Tutorial.cy.js')

        await ctx.actions.file.writeFileInProject(
          tutorialCyPath,
          (await ctx.file.readFileInProject(tutorialCyPath)).replace('Nuxt', 'Tutorial'),
        )
      })

      cy.waitForSpecToFinish({ passCount: 1 })
    })

    it('should show compilation errors on src changes', () => {
      cy.visitApp()

      cy.contains('Tutorial.cy.js').click()
      cy.waitForSpecToFinish({ passCount: 1 })

      // Create compilation error
      cy.withCtx(async (ctx) => {
        const tutorialVuePath = ctx.path.join('components', 'Tutorial.vue')

        await ctx.actions.file.writeFileInProject(
          tutorialVuePath,
          (await ctx.file.readFileInProject(tutorialVuePath)).replace('export', 'expart'),
        )
      })

      // The test should fail and the stack trace should appear in the command log
      cy.waitForSpecToFinish({ failCount: 1 })
      cy.contains('The following error originated from your test code, not from Cypress.').should('exist')
    })

    // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23455
    it.skip('should detect new spec', () => {
      cy.visitApp()

      cy.withCtx(async (ctx) => {
        const newSpecPath = ctx.path.join('components', 'New.cy.js')
        const tutorialCyPath = ctx.path.join('components', 'Tutorial.cy.js')

        await ctx.actions.file.writeFileInProject(
          newSpecPath,
          await ctx.file.readFileInProject(tutorialCyPath),
        )
      })

      cy.contains('New.cy.js').click()
      cy.waitForSpecToFinish({ passCount: 1 })
    })
  })
}
