/// <reference path="../support/e2e.ts" />
import type { ProjectFixtureDir } from '@tooling/system-tests/lib/fixtureDirs'

const WEBPACK_REACT: ProjectFixtureDir[] = ['cra-4', 'cra-5', 'cra-ejected']

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
      cy.contains('App.cy.js').click()
      cy.waitForSpecToFinish()
      cy.get('.passed > .num').should('contain', 1)
    })

    it('should live-reload on src changes', () => {
      cy.visitApp()

      cy.contains('App.cy.js').click()
      cy.waitForSpecToFinish()
      cy.get('.passed > .num').should('contain', 1)

      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject(
          ctx.path.join('src', 'App.js'),
          (await ctx.file.readFileInProject(ctx.path.join('src', 'App.js'))).replace('Learn React', 'Want to learn React?'),
        )
      })

      cy.get('.failed > .num').should('contain', 1)

      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject(
          ctx.path.join('src', 'App.cy.js'),
          (await ctx.file.readFileInProject(ctx.path.join('src', 'App.cy.js'))).replace('Learn React', 'Want to learn React?'),
        )
      })

      cy.get('.passed > .num').should('contain', 1)
    })

    it('should detect new spec', () => {
      cy.visitApp()

      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject(
          ctx.path.join('src', 'New.cy.js'),
          await ctx.file.readFileInProject(ctx.path.join('src', 'App.cy.js')),
        )
      })

      cy.contains('New.cy.js').click()
      cy.waitForSpecToFinish()
      cy.get('.passed > .num').should('contain', 1)
    })
  })
}
