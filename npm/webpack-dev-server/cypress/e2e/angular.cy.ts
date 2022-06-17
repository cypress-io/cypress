// <reference types="cypress" />
/// <reference path="../support/e2e.ts" />
import type { ProjectFixtureDir } from '@tooling/system-tests/lib/fixtureDirs'

const WEBPACK_REACT: ProjectFixtureDir[] = ['angular-12', 'angular-13', 'angular-14']

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
      cy.waitForSpecToFinish()
      cy.get('.passed > .num').should('contain', 1)
    })

    it('should live-reload on src changes', () => {
      cy.visitApp()
      cy.contains('app.component.cy.ts').click()
      cy.waitForSpecToFinish()
      cy.get('.passed > .num').should('contain', 1)

      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject(
          ctx.path.join('src', 'app', 'app.component.html'),
          (await ctx.file.readFileInProject(ctx.path.join('src', 'app', 'app.component.html'))).replace('Hello World', 'Hello Cypress'),
        )
      })

      cy.get('.failed > .num').should('contain', 1)

      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject(
          ctx.path.join('src', 'app', 'app.component.html'),
          (await ctx.file.readFileInProject(ctx.path.join('src', 'app', 'app.component.html'))).replace('Hello Cypress', 'Hello World'),
        )
      })

      cy.get('.passed > .num').should('contain', 1)
    })

    it('should detect new spec', () => {
      cy.visitApp()

      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject(
          ctx.path.join('src', 'app', 'new.component.cy.ts'),
          await ctx.file.readFileInProject(ctx.path.join('src', 'app', 'app.component.cy.ts')),
        )
      })

      cy.contains('new.component.cy.ts').click()
      cy.waitForSpecToFinish()
      cy.get('.passed > .num').should('contain', 1)
    })
  })
}
