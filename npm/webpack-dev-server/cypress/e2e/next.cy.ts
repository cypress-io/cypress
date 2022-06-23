/// <reference path="../support/e2e.ts" />
import type { ProjectFixtureDir } from '@tooling/system-tests/lib/fixtureDirs'

const WEBPACK_REACT: ProjectFixtureDir[] = ['next-11', 'next-12', 'next-11-webpack-4', 'next-12.1.6']

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
      cy.contains('index.cy.js').click()
      cy.waitForSpecToFinish()
      cy.get('.passed > .num').should('contain', 1)
    })

    it('should live-reload on src changes', () => {
      cy.visitApp()

      cy.contains('index.cy.js').click()
      cy.waitForSpecToFinish()
      cy.get('.passed > .num').should('contain', 1)

      cy.withCtx(async (ctx) => {
        const indexPath = ctx.path.join('pages', 'index.js')

        await ctx.actions.file.writeFileInProject(
          indexPath,
          (await ctx.file.readFileInProject(indexPath)).replace('Welcome to', 'Hello from'),
        )
      })

      cy.get('.failed > .num', { timeout: 10000 }).should('contain', 1)

      cy.withCtx(async (ctx) => {
        const indexTestPath = ctx.path.join('pages', 'index.cy.js')

        await ctx.actions.file.writeFileInProject(
          indexTestPath,
          (await ctx.file.readFileInProject(indexTestPath)).replace('Welcome to', 'Hello from'),
        )
      })

      cy.get('.passed > .num').should('contain', 1)
    })

    it('should detect new spec', () => {
      cy.visitApp()

      cy.withCtx(async (ctx) => {
        const newTestPath = ctx.path.join('pages', 'New.cy.js')
        const indexTestPath = ctx.path.join('pages', 'index.cy.js')

        await ctx.actions.file.writeFileInProject(
          newTestPath,
          await ctx.file.readFileInProject(indexTestPath),
        )
      })

      cy.contains('New.cy.js').click()
      cy.waitForSpecToFinish()
      cy.get('.passed > .num').should('contain', 1)
    })
  })
}
