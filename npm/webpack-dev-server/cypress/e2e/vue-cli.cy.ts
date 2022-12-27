/// <reference path="../support/e2e.ts" />
import type { ProjectFixtureDir } from '@tooling/system-tests/lib/fixtureDirs'

const PROJECTS: ProjectFixtureDir[] = ['vuecli4-vue2', 'vuecli4-vue3', 'vuecli5-vue3', 'vuecli5-vue3-type-module']

// Add to this list to focus on a particular permutation
const ONLY_PROJECTS: ProjectFixtureDir[] = []

for (const project of PROJECTS) {
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
      cy.contains('HelloWorld.cy.js').click()
      cy.waitForSpecToFinish({ passCount: 1 })
      cy.get('.commands-container').within(() => {
        cy.contains('mount')
        cy.contains('<HelloWorld ... />')
      })
    })

    it('should live-reload on src changes', () => {
      cy.visitApp()

      cy.contains('HelloWorld.cy.js').click()
      cy.waitForSpecToFinish({ passCount: 1 })

      cy.withCtx(async (ctx) => {
        const helloWorldVuePath = ctx.path.join('src', 'components', 'HelloWorld.vue')

        await ctx.actions.file.writeFileInProject(
          helloWorldVuePath,
          (await ctx.file.readFileInProject(helloWorldVuePath)).replace('{{ msg }}', ''),
        )
      })

      cy.waitForSpecToFinish({ failCount: 1 })
      cy.get('.test-err-code-frame').should('be.visible')

      cy.withCtx(async (ctx) => {
        const helloWorldVuePath = ctx.path.join('src', 'components', 'HelloWorld.vue')

        await ctx.actions.file.writeFileInProject(
          helloWorldVuePath,
          (await ctx.file.readFileInProject(helloWorldVuePath)).replace('<h1></h1>', '<h1>{{ msg }}</h1>'),
        )
      })

      cy.waitForSpecToFinish({ passCount: 1 })
    })

    it('should show compilation errors on src changes', () => {
      cy.visitApp()

      cy.contains('HelloWorld.cy.js').click()
      cy.waitForSpecToFinish({ passCount: 1 })

      // Create compilation error
      cy.withCtx(async (ctx) => {
        const helloWorldVuePath = ctx.path.join('src', 'components', 'HelloWorld.vue')

        await ctx.actions.file.writeFileInProject(
          helloWorldVuePath,
          (await ctx.file.readFileInProject(helloWorldVuePath)).replace('export', 'expart'),
        )
      })

      // The test should fail and the stack trace should appear in the command log
      cy.waitForSpecToFinish({ failCount: 1 })
      cy.contains('The following error originated from your test code, not from Cypress.').should('exist')
    })
  })
}
