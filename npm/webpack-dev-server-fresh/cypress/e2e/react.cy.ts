/// <reference types="cypress" />
/// <reference path="../support/e2e.ts" />
import type { e2eProjectDirs } from '@packages/frontend-shared/cypress/e2e/support/e2eProjectDirs'

type ProjectDirs = typeof e2eProjectDirs

const WEBPACK_REACT: ProjectDirs[number][] = ['webpack4_wds3-react', 'webpack4_wds4-react', 'webpack5_wds3-react', 'webpack5_wds4-react']

// Add to this list to focus on a particular permutation
const ONLY_PROJECTS: ProjectDirs[number][] = []

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
      cy.contains('App.cy.jsx').click()
      cy.get('.passed > .num').should('contain', 1)
    })

    it('MissingReact: should fail, rerun, succeed', () => {
      cy.once('uncaught:exception', () => {
        // Ignore the uncaught exception in the AUT
        return false
      })

      cy.visitApp()
      cy.contains('MissingReact.cy.jsx').click()
      cy.get('.failed > .num').should('contain', 1)
      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject(`src/MissingReact.jsx`,
        `import React from 'react';
        ${await ctx.actions.file.readFileInProject('src/MissingReact.jsx')}`)
      })

      cy.get('.passed > .num').should('contain', 1)
    })

    it('MissingReactInSpec: should fail, rerun, succeed', () => {
      cy.visitApp()
      cy.contains('MissingReactInSpec.cy.jsx').click()
      cy.get('.failed > .num').should('contain', 1)
      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject(`src/MissingReactInSpec.cy.jsx`,
          await ctx.actions.file.readFileInProject('src/App.cy.jsx'))
      })

      cy.get('.passed > .num').should('contain', 1)
    })
  })
}
